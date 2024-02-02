#!/bin/zsh

# must be run from project root
source ./bin/utils.sh

e_header "Creating new entry..."
e_question "Slug/path? (no slashes)"
read slug
e_question "Title?"
read title
e_question "Description?"
read description
e_question "Tags? (space separated, lowercase)"
read tags
new_path="src/${slug}"
new_date="$(date '+%Y-%m-%d')"
mkdir ${new_path}
cp templates/* ${new_path}

# Fill in html meta
echo -e "<!doctype html>\n<html class=\"\" lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <title>${title}</title>\n    <meta name=\"description\" content=\"${description}\" />\n$(cat templates/index.html)" > "${new_path}/index.html"

# Create json
echo -e "{ \"title\": \"${title}\", \"description\": \"${description}\", \"tags\": \"${tags}\", \"url\": \"/${slug}/\", \"date\": \"${new_date}\" }" > "${new_path}/data.json"

e_success "New entry created!"
