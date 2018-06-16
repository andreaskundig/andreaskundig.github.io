find . ! -name build.sh ! -name .git -delete
cp -r ../stroke-looper/dist/* .
rm -rf dossier
mkdir dossier
cp -r ../stroke-looper/dossier/public dossier/
