function convertswf {
  # are in correct directory
  echo '* * *' swfrender $1
  swfrender $1
  echo '* * *' cp output.png $1
  cp output.png $1
}

function convertmeta {
  echo '* *' sed -i.bak s/.swf/.png/g meta.json
  echo sed -i.bak s/.swf/.png/g meta.json
}

while read f;
do 
  echo '*' cd video/$f/timeline
  cd video/$f/timeline
  for s in *.swf;
  do
    convertswf $s
  done
  cd ..
  convertmeta $f
  cd ../..
done < files
