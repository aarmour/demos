module.exports = {
	"options": {
		"sass": "demos/src/scss/demo.scss",
		"bodyClasses": "o-hoverable-on",
		"template": "main.mustache",
		"data": {
			"content": require('fs').readFileSync('demos/src/html/content.html')
		}
	},
	"demos": [
		{
			"name": "scaffold",
			"sass": "demos/src/scss/scaffold.scss",
			"data": {
				"o-he-header": {
					"primary": {
						"left": require('fs').readFileSync('demos/src/html/scaffold/primary.left.html'),
						"right": require('fs').readFileSync('demos/src/html/scaffold/primary.right.html')
					}
				}
			}
		},
		{
			"name": "basic",
			"data": {
				"o-he-header": {
					"container": {
						"extra-classes": "demo__container"
					},
					"primary": {
						"left": "<div class=\"o-he-header__brand\"><div class=\"o-he-header__logo o-he-header__logo--pearson\"></div></div>",
						"right": "<div class=\"o-he-header__tagline o-he-header__tagline--always-learning pull-right\"></div>"
					}
				}
			}
		},
		{
			"name": "navigation",
			"data": {
				"o-he-header": {
					"container": {
						"extra-classes": "demo__container"
					},
					"primary": {
						"left": require('fs').readFileSync('demos/src/html/navigation/primary.left.html'),
						"right": require('fs').readFileSync('demos/src/html/navigation/primary.right.html')
					}
				}
			}
		}
	]
};
