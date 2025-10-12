#

cd dist
for dir in *; do 
    echo "$dir"
    cd $dir
    zip -r "../$dir.zip" "index.js"
    cd ..
done
cd ..