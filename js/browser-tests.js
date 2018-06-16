var allTestsWithAlert = function(){
    log = function(m, s){ console.log(m, s); alert(m+ '\n' + (s||''));};
    allTests();
};
var testNames = ['normalCurve', 'reversedCurve', 'curveAtCreation',
                 'curveAtCreationNoBeat', 
                 'curveAtCreationMultiPeriod', 
                 'frozenCurveAtCreation',
                 'correctedNow', 'reverseCurveAtCreation',
                 'reverseCurveAtCreationMultiPeriodDetailed',
                 'reverseCurveAtCreationMultiPeriod'];
var allTests = function(){
    var failed = testNames.map(runTest).filter(function(ok){return !ok;});
    log(failed.length, 'tests failed');
};
var runTest = function(testName){
    var ok = true;
    log('. ' + testName);
    try{
        window[testName]();
    }catch(e){
        ok = false;
        log(e.message, e.stack);
    }
    return ok;
};

var log = console.log.bind(console);
var ass = chai.assert;

var setupLooper = function(lifetime, beat, multiPeriod){
    var canvasParent = document.getElementById('canvas-parent'),
             graphics = {canvas: document.getElementById('main-canvas'),
                         paper:paper}, 
             looper = makeLooper({graphics: graphics,
			     beat: beat,
			     multiPeriod: multiPeriod});
			    
    looper.setLifetime(lifetime);
    return looper;
};

var segmentsAt = function(line, time){
    var periodSegments = pSegmentsAt(line,time);
    return [].concat.apply([], periodSegments); //flatten
};

var pSegmentsAt = function(line, time){
    return line.periodSegmentsToShow(time).map(function(segments){
        return segments.map(function(s){ return [s.point.x, s.point.y]; });
    });
};

var normalCurve = function(){
    var beat = 2000;
    var multiPeriod = "auto";
    var looper = setupLooper(100, beat, multiPeriod);
    var start = 1460480954631;
    var ms = start;
    var l = looper.newLine(looper.getTime(ms), multiPeriod);
    looper.drawPoint(100,50,looper.getTime(ms+=50));
    looper.drawPoint(110,60,looper.getTime(ms+=50));
    looper.drawPoint(120,80,looper.getTime(ms+=50));
    looper.completeLine(looper.getTime(ms+=50));
    var data = l.exportData();        
    ass.deepEqual([50, 100, 150], data.times);

    ass.deepEqual([], segmentsAt(l, start + 49));
    ass.deepEqual([[100, 50]], segmentsAt(l, start + 50));
    ass.deepEqual([[100, 50]], segmentsAt(l, start + 50 - beat));
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, start + 100));
    ass.deepEqual(
        [[100, 50], [110, 60]], segmentsAt(l, start + 100 + beat));
    ass.deepEqual([[110, 60], [120, 80] ], segmentsAt(l, start + 150));
    ass.deepEqual([[120, 80]], segmentsAt(l, start + 200));
    ass.deepEqual([], segmentsAt(l, start + 250));
};

var reversedCurve = function(){
    var beat = 2000;
    var multiPeriod = "auto";
    var looper = setupLooper(100, beat, multiPeriod);
    var start = 1460480954631;
    var now = start;

    var l = looper.newLine(looper.getTime(now), multiPeriod);
    looper.drawPoint(100,50,looper.getTime(now+=50));
    looper.drawPoint(110,60,looper.getTime(now+=50));
    looper.drawPoint(120,80,looper.getTime(now+=50));
    looper.completeLine(looper.getTime(now+=50));
    var data = l.exportData();        
    ass.deepEqual([50, 100, 150], data.times);
    
    var corNow = looper.getTime(now+=beat-200);
    corNow = looper.getTime(now+=49);
    ass.deepEqual([], segmentsAt(l, corNow));
    corNow = looper.getTime(now+=50);
    ass.deepEqual([[100, 50]], segmentsAt(l, corNow));
    corNow = looper.getTime(now+=50);
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, corNow));
    corNow = looper.getTime(now+=50);
    ass.deepEqual([[110, 60], [120, 80] ], segmentsAt(l, corNow));

    looper.setSpeed(-1);
    corNow = looper.getTime(now+=50);
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, corNow));
    corNow = looper.getTime(now+=50);
    // log(l.calculateTime(corNow).now); 
    ass.deepEqual([[100, 50]], segmentsAt(l, corNow));
    corNow = looper.getTime(now+=50);
    ass.deepEqual([], segmentsAt(l, corNow));
};

var correctedNow = function(){
    var multiPeriod = "auto";
    var looper = setupLooper(100, 2000, multiPeriod);
    var now = 0;

    ass.equal(0, looper.getTime(0));
    ass.equal(100, looper.getTime(100));

    looper.setSpeed(2);
    ass.equal(300, looper.getTime(200));
    
    looper.setSpeed(-1);
    ass.equal(280, looper.getTime(220));
    
    looper.setSpeed(-0.5);
    ass.equal(270, looper.getTime(240));
};

var curveAtCreationDetailed = function(){
    var beat = 2000;
    var multiPeriod = "auto";
    var looper = setupLooper(100, beat, multiPeriod);
    var start = 1460480954631;
    var now = start;
    
    var l = looper.newLine(now, multiPeriod);
    ass.equal(0, l.calculateTime(now).now);
    
    looper.drawPoint(100,50, new Date(now+=50));
    ass.equal(50, l.calculateTime(now).now); //t.now
    ass.deepEqual([50], l.exportData().times); //birth
    ass.deepEqual([[100, 50]], segmentsAt(l, now));
    //    50      100     150
    //    .birth         .birth + lifetime
    //    .--------------> point 1
    //    . now
    ass.deepEqual([], segmentsAt(l, now - 3));
    //    50      100     150
    //  | .--------------> point 1
    //  .now

    looper.drawPoint(110,60, new Date(now+=50));
    ass.equal(100, l.calculateTime(now).now); //t.now
    ass.deepEqual([50, 100], l.exportData().times); //birth
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, now));
    //    50      100     150
    //    .-------|------> point 1
    //            .--------------> point 2
    //            .now   

    looper.drawPoint(120,80, new Date(now+=50));
    ass.equal(150, l.calculateTime(now).now); //t.now
    ass.deepEqual([50, 100, 150], l.exportData().times); //birth
    ass.deepEqual([[110, 60], [120, 80]], segmentsAt(l, now));
    //    50      100     150
    //    .-------------->| point 1
    //            .-------|------> point 2
    //                    .--------------> point 3
    //                    .now   

    looper.completeLine(new Date(now+=50));
    ass.equal(200, l.calculateTime(now).now); //t.now
    ass.deepEqual([50, 100, 150], l.exportData().times); //birth
    ass.deepEqual([[120, 80]], segmentsAt(l, now));
    //    50      100     150     200
    //    .--------------> p1     |
    //            .-------------->|point 2
    //                    .-------|------> point 3
    //    ......................... last = 150
    //                            .now   

    ass.deepEqual([[100, 50]], segmentsAt(l, start + 50));
    ass.deepEqual([[100, 50]], segmentsAt(l, start + 50 - beat));
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, start + 100));
    ass.deepEqual(
        [[100, 50], [110, 60]], segmentsAt(l, start + 100 + beat));
    ass.deepEqual([[110, 60], [120, 80] ], segmentsAt(l, start + 150));
    ass.deepEqual([[120, 80]], segmentsAt(l, start + 200));
    ass.deepEqual([], segmentsAt(l, start + 250));
    
};

var curveAtCreation = function(){
    var beat = 2000;
    var multiPeriod = "auto";
    var looper = setupLooper(100, beat, multiPeriod);
    var start = 1460480954631;
    var now = start;
    
    var l = looper.newLine(now, multiPeriod);
    ass.equal(0, l.calculateTime(now).now);
    
    looper.drawPoint(100,50, now+=50);
    ass.deepEqual([[100, 50]], segmentsAt(l, now));

    looper.drawPoint(110,60, now+=50);
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, now));

    looper.drawPoint(120,80, now+=50);
    ass.deepEqual([[110, 60], [120, 80]], segmentsAt(l, now));

    looper.completeLine(now+=50);
    ass.deepEqual([[120, 80]], segmentsAt(l, now));

    ass.deepEqual([[100, 50]], segmentsAt(l, start + 50));
    ass.deepEqual([[100, 50]], segmentsAt(l, start + 50 - beat));
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, start + 100));
    ass.deepEqual(
        [[100, 50], [110, 60]], segmentsAt(l, start + 100 + beat));
    ass.deepEqual([[110, 60], [120, 80] ], segmentsAt(l, start + 150));
    ass.deepEqual([[120, 80]], segmentsAt(l, start + 200));
    ass.deepEqual([], segmentsAt(l, start + 250));
    
};

var curveAtCreationNoBeat = function(){
    var beat = 1;
    var multiPeriod = 0;
    var lifetime = 100;
    var looper = setupLooper(lifetime, beat, multiPeriod);
    var start = 1460480954631;
    var now = start;
    
    var l = looper.newLine(now, multiPeriod);
    ass.equal(0, l.calculateTime(now).now);
    
    looper.drawPoint(100,50, now+=50);
    ass.deepEqual([[100, 50]], segmentsAt(l, now));

    looper.drawPoint(110,60, now+=50);
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, now));

    looper.drawPoint(120,80, now+=50);
    ass.deepEqual([[110, 60], [120, 80]], segmentsAt(l, now));

    looper.completeLine(now+=50);
    ass.deepEqual([[120, 80]], segmentsAt(l, now));

    var duration = l.exportData().last + lifetime;

    ass.deepEqual([[100, 50]], segmentsAt(l, start + 50));
    ass.deepEqual([[100, 50]], segmentsAt(l, start + 50 - duration));
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, start + 100));
    ass.deepEqual(
        [[100, 50], [110, 60]], segmentsAt(l, start + 100 + duration +1));
    ass.deepEqual([[110, 60], [120, 80] ], segmentsAt(l, start + 150));
    ass.deepEqual([[120, 80]], segmentsAt(l, start + 200));
    ass.deepEqual([], segmentsAt(l, start + 250));
    
};

var curveAtCreationMultiPeriod = function(){
    var beat = 2000;
    var incr = 800;
    var multiPeriod = 1;
    var looper = setupLooper(2*incr, beat, multiPeriod);
    var start = 1460480954631;
    var now = start;

    var corNow = looper.getTime(now);
    ass.equal(now, corNow); 
    var l = looper.newLine(now, multiPeriod); //0
    ass.equal(0, l.calculateTime(now).now);
    
    looper.drawPoint(100,50, now+=incr); //800
    ass.equal(2, pSegmentsAt(l, now).length);
    ass.deepEqual([[100, 50]], pSegmentsAt(l, now)[0]); //800
    ass.deepEqual([], pSegmentsAt(l, now)[1]); //2800

    looper.drawPoint(110,60, now+=incr); //1600
    ass.equal(2, pSegmentsAt(l, now).length);
    ass.deepEqual([[100, 50], [110, 60]], pSegmentsAt(l, now)[0]); //1600
    ass.deepEqual([], pSegmentsAt(l, now)[1]); //2600
    ass.ok(now-start < beat);

    looper.drawPoint(120,80, now+=incr); //2400
    ass.ok(now-start > beat);
    ass.equal(3, pSegmentsAt(l, now).length);
    ass.deepEqual([], pSegmentsAt(l, now)[0]); //400
    ass.deepEqual([[110, 60], [120, 80]], pSegmentsAt(l, now)[1]); //2400
    ass.deepEqual([], pSegmentsAt(l, now)[2]); //4400

    looper.completeLine(now+=incr); //3200
    ass.deepEqual([[100, 50]], pSegmentsAt(l, now)[0]); //800
    ass.deepEqual([[120, 80]], pSegmentsAt(l, now)[1]); //3200

    ass.deepEqual([1,2,3].map(function(i){ return i * incr;}),
                  l.exportData().times); //birth

    now = start + incr; //800: 800 2800
    ass.deepEqual([[100, 50]], pSegmentsAt(l, now)[0]); //800
    ass.deepEqual([[110, 60],[120, 80]], pSegmentsAt(l, now)[1]); //2800

    now = start + incr - 2*beat; //-1200: 800 2800
    ass.deepEqual([[100, 50]], pSegmentsAt(l, now)[0]); //800
    ass.deepEqual([[110, 60],[120, 80]], pSegmentsAt(l, now)[1]); //2800
    
    now = start + incr + 2*beat; //2800: 800 2800
    ass.deepEqual([[100, 50]], pSegmentsAt(l, now)[0]); //800
    ass.deepEqual([[110, 60],[120, 80]], pSegmentsAt(l, now)[1]); //2800
    
    now = start + 2*incr + 2*beat; //3600: 1600 3200
    ass.deepEqual([[100, 50], [110, 60]], pSegmentsAt(l, now)[0]); //1600
    ass.deepEqual([[120, 80]], pSegmentsAt(l, now)[1]); //3200
    
};

var reverseCurveAtCreation = function(){
    var lifetime = 100;
    var multiPeriod = "auto";
    var looper = setupLooper(100, 2000, multiPeriod);
    var start = 5000;
    var now = start;
    looper.setSpeed(-1);
    
    var corNow = looper.getTime(now);
    ass.equal(-5000, corNow); 
    var l = looper.newLine(corNow, multiPeriod);
    ass.equal(0, l.calculateTime(corNow).now); //t.now
    ass.equal(-5000, l.exportData().start);
    
    corNow = looper.getTime(now+=50);
    ass.equal(-5050, corNow); 
    ass.equal(-50, l.calculateTime(corNow).now); //t.now
    looper.drawPoint(100, 50, corNow);
    ass.deepEqual([-150], l.exportData().times); //birth
    ass.deepEqual([[100, 50]], segmentsAt(l, corNow - 1));
    // -250    -200    -150    -100    -50
    //                 .birth         .birth + lifetime
    //                 .--------------> point 1
    //                                . now - 1
    
    corNow = looper.getTime(now+=50);
    ass.equal(-5100, corNow); 
    ass.equal(-100, l.calculateTime(corNow).now); //t.now
    looper.drawPoint(110, 60, corNow);
    ass.deepEqual([-150, -200], l.exportData().times); //birth
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, corNow - 1));
    // -250    -200    -150    -100    -50
    //         .birth         .birth + lifetime
    //                 .------|-------> point 1
    //         .--------------> point 2
    //                        . now - 1

    corNow = looper.getTime(now+=50);
    ass.equal(-5150, corNow); 
    ass.equal(-150, l.calculateTime(corNow).now); //t.now
    looper.drawPoint(120, 80, corNow);
    ass.deepEqual([-150, -200, -250], l.exportData().times); //birth
    ass.deepEqual([[110, 60], [120, 80]], segmentsAt(l, corNow - 1));
    // -250    -200    -150    -100    -50
    //                |.--------------> point 1
    //         .------|-------> point 2
    // .--------------> point 3
    //                . now - 1

    corNow = looper.getTime(now+=50);
    ass.equal(-5200, corNow); 
    ass.equal(-200, l.calculateTime(corNow).now);
    ass.deepEqual([[120, 80]], segmentsAt(l, corNow - 1));
    looper.completeLine(corNow);
    ass.equal(1800, l.calculateTime(corNow).now);
    ass.deepEqual([-150, -200, -250], l.exportData().times); //birth
    ass.deepEqual([[120, 80]], segmentsAt(l, corNow - 1));
    // -250    -200    -150    -100    -50     0
    // 1750    1800    1850    1900    1950    2000
    //        |        .--------------> point 1
    //        |.--------------> point 2
    // .------|-------> point 3
    //        ......................... last = 150
    //        . now - 1


    ass.deepEqual([[100, 50]], segmentsAt(l, start - 51));
    ass.deepEqual([[100, 50]], segmentsAt(l, start + 1949));
};

var frozenCurveAtCreation = function(){
    var beat = 2000;
    var multiPeriod = "auto";
    var looper = setupLooper(100, beat, multiPeriod);
    var start = 5000;
    var now = start;
    ass.equal(5000, looper.getTime(now));
    looper.setSpeed(0);
    ass.equal(5000, looper.getTime(now));
    ass.equal(5000, looper.getTime(now+50));

    var l = looper.newLine(now, multiPeriod);
    ass.equal(0, l.calculateTime(now).now);
    
    looper.drawPoint(100,50, now);
    ass.deepEqual([[100, 50]], segmentsAt(l, now));

    looper.drawPoint(110,60, now);
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, now));

    looper.drawPoint(120,80, now);
    var allPoints = [[100, 50], [110, 60], [120, 80]];
    ass.deepEqual(allPoints, segmentsAt(l, now));

    looper.completeLine(now);
    ass.deepEqual(allPoints, segmentsAt(l, now));
    ass.deepEqual(allPoints, segmentsAt(l, now + 50));
    ass.deepEqual([], segmentsAt(l, now + 150));
    ass.deepEqual(allPoints, segmentsAt(l, now + beat));
    ass.deepEqual([], segmentsAt(l, now + beat + 150));

};

var reverseCurveAtCreationMultiPeriodDetailed = function(){
    var lifetime = 100;
    var multiPeriod = 1;
    var looper = setupLooper(100, 2000, multiPeriod);
    var start = 5000;
    var now = start;
    looper.setSpeed(-1);
     
    var times = [-150, -200, -250]; 

    var corNow = looper.getTime(now);
    ass.equal(-5000, corNow); 
    var l = looper.newLine(corNow, multiPeriod);
    ass.equal(0, l.calculateTime(corNow).now); //t.now
    ass.equal(-5000, l.exportData().start);
    
    corNow = looper.getTime(now+=50);
    ass.equal(-5050, corNow); 
    ass.equal(1950, l.calculateTime(corNow).now); //t.now
    looper.drawPoint(100, 50, corNow);
    ass.deepEqual(times.slice(0,1), l.exportData().times); //birth
    ass.deepEqual([[100, 50]], segmentsAt(l, corNow - 1));
    // -250    -200    -150    -100    -50     0
    // 1750    1800    1850    1900    1950
    //                 .birth         .birth + lifetime
    //                 .--------------> point 1
    //                                . now - 1
    
    corNow = looper.getTime(now+=50);
    ass.equal(-5100, corNow); 
    ass.equal(1900, l.calculateTime(corNow).now); //t.now
    looper.drawPoint(110, 60, corNow);
    ass.deepEqual(times.slice(0,2), l.exportData().times); //birth
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, corNow - 1));
    // -250    -200    -150    -100    -50     0
    // 1750    1800    1850    1900    1950
    //         .birth         .birth + lifetime
    //                 .------|-------> point 1
    //         .--------------> point 2
    //                        . now - 1

    corNow = looper.getTime(now+=50);
    ass.equal(-5150, corNow); 
    ass.equal(1850, l.calculateTime(corNow).now); //t.now
    looper.drawPoint(120, 80, corNow);
    ass.deepEqual(times.slice(0,3), l.exportData().times); //birth
    ass.deepEqual([[110, 60], [120, 80]], segmentsAt(l, corNow - 1));
    // -250    -200    -150    -100    -50     0
    // 1750    1800    1850    1900    1950
    //                |.--------------> point 1
    //         .------|-------> point 2
    // .--------------> point 3
    //                . now - 1

    corNow = looper.getTime(now+=50);
    ass.equal(-5200, corNow); 
    ass.equal(1800, l.calculateTime(corNow).now);
    ass.deepEqual([[120, 80]], segmentsAt(l, corNow - 1));
    looper.completeLine(corNow);
    ass.deepEqual(times, l.exportData().times); //birth
    //ass.deepEqual([1850, 1800, 1750], l.exportData().times); //birth
    ass.deepEqual([[120, 80]], segmentsAt(l, corNow - 1));
    // -250    -200    -150    -100    -50     0
    // 1750    1800    1850    1900    1950    2000
    //        |        .--------------> point 1
    //        |.--------------> point 2
    // .------|-------> point 3
    //        ......................... last = 150
    //        . now - 1
    
    ass.deepEqual([[120, 80]], segmentsAt(l, start + 1800 - 1));
    
};

var reverseCurveAtCreationMultiPeriod = function(){
    var lifetime = 100;
    var multiPeriod = 1;
    var looper = setupLooper(lifetime, 2000, multiPeriod);
    var start = 5000;
    var now = start;
    looper.setSpeed(-1);

    var corNow = looper.getTime(now);
    var l = looper.newLine(corNow, multiPeriod);
    
    corNow = looper.getTime(now+=50);
    looper.drawPoint(100, 50, corNow);
    ass.deepEqual([[100, 50]], segmentsAt(l, corNow - 1));
    
    corNow = looper.getTime(now+=50);
    looper.drawPoint(110, 60, corNow);
    ass.deepEqual([[100, 50], [110, 60]], segmentsAt(l, corNow - 1));

    corNow = looper.getTime(now+=50);
    looper.drawPoint(120, 80, corNow);
    ass.deepEqual([[110, 60], [120, 80]], segmentsAt(l, corNow - 1));

    corNow = looper.getTime(now+=50);
    ass.deepEqual([[120, 80]], segmentsAt(l, corNow - 1));
    looper.completeLine(corNow);
    ass.deepEqual([[120, 80]], segmentsAt(l, corNow - 1));
};
