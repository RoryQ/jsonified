dev:
	npx wrangler dev

deploy:
	npx wrangler deploy

.PHONY: test
test:
	npm test
