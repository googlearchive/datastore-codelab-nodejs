#~/bin/sh

shopt -s extglob

html/pygmentize.sh
git branch -D gh-pages
git checkout --orphan gh-pages || exit 1
git rm -rf !(html) .gitignore
git mv html/index.html index.html
git commit -m 'Created a github page synced with the master'
git push -f origin gh-pages
git checkout master
git branch -D gh-pages

