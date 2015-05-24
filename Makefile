# App packaging

### Generate the zip archive
zip: manifest.webapp
	rm app.zip
	zip -r app.zip . --exclude app.zip Makefile "*design_notes*" "*.git*" "*css/style/*.html"

