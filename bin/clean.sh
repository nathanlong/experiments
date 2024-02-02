#!/bin/zsh

# must be run from project root
source ./bin/utils.sh

e_header "Cleaning up build..."
cd dist
setopt extendedglob
rm -r -- ^*.git
setopt noextendedglob
cd ..
e_success "Cleaned!"
