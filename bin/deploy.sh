#!/bin/zsh

source ./bin/utils.sh
source ./bin/clean.sh

timestamp=`date "+%y%m%d"`
directory='dist'
branch='gh-pages'

e_header "Cleaning up first..."
rm -rf $directory
git worktree prune

e_header "Attaching git worktree..."
git worktree add $directory $branch

e_header "Building site..."
npm run build
e_success "Built!"

e_header "Creating new build for $timestamp"
cd $directory
git add --all
git commit --amend --message "build $timestamp"
git push origin $branch --force-with-lease
cd ..
e_success "Build $timestamp pushed to remote"
