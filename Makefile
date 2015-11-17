# App packaging

### Generate the zip archive (should delete the old zip first)
zip: manifest.webapp
	zip -r app.zip . --exclude app.zip Makefile .editorconfig .jshintrc TODO "*design_notes*" "*.git*" "*css/style/*.html" "*screenshots*"

