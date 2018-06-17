rm -rf animations font-awesome-4.6.3 icons js lib dossier
find . -maxdepth 1 -not \( -name build.sh -or -name .git  \) -delete
cp -r ../stroke-looper/dist/* .
mkdir dossier
cp -r ../stroke-looper/dossier/public dossier/
