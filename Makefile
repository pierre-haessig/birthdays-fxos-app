# App packaging

### Generate the zip archive
zip: manifest.webapp
	zip -r app.zip . --exclude app.zip Makefile .editorconfig .jshintrc "*design_notes*" "*.git*" "*css/style/*.html" "*screenshots*"

