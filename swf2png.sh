function convertswf {
  # are in correct directory
  echo '* * *' swfrender $1
  swfrender $1
  echo '* * *' cp output.png $1
  pngfile=${1%swf}png
  cp output.png $pngfile
}

function convertmeta {
  echo '* *' sed -i.bak s/.swf/.png/g meta.json
  sed -i.bak s/.swf/.png/g meta.json
}

while read f;
do
  echo '*' cd $f/timeline
  cd $f/timeline
  for s in *.swf;
  do
    convertswf $s
  done
  cd ..
  convertmeta $f
  cd ..
done
