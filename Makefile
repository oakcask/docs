PROJECT_AGENTS_MD = $(wildcard */AGENTS.md)
PROJECT_METADATA = $(wildcard */metadata.json)
DOC_DIRS = $(patsubst %/metadata.json,%,$(PROJECT_METADATA))
SKILLS_SYMLINKS = $(patsubst %/AGENTS.md,%/.agents/skills,$(PROJECT_AGENTS_MD))
DIST_DIR = dist
AGENTS_TEMPLATE = templates/AGENTS.md.tmpl
INDEX_HTML = $(patsubst %,$(DIST_DIR)/%/index.html,$(DOC_DIRS))
DOCS_HTML = $(DIST_DIR)/index.html

define DOC_INPUTS
$1/metadata.json \
$(wildcard $1/ABSTRACT.md) \
$(wildcard $1/TOC.md) \
$(wildcard $1/sections/*.md) \
$(wildcard $1/sections/*/*.md) \
$(wildcard $1/APPENDIX.md) \
$(wildcard $1/REFERENCES.md) \
scripts/generate-doc-html.mjs
endef

define DOC_RULE
$(DIST_DIR)/$1/index.html: $$(call DOC_INPUTS,$1)
	mkdir -p $$(dir $$@)
	node scripts/generate-doc-html.mjs $1 $$@
endef

.PHONY: setup docs new
setup: $(SKILLS_SYMLINKS)
docs: $(INDEX_HTML) $(DOCS_HTML)
new: $(AGENTS_TEMPLATE)
	mkdir -p "$(DIR)"
	cp "$(AGENTS_TEMPLATE)" "$(DIR)/AGENTS.md"
	make

$(DOCS_HTML): $(PROJECT_METADATA) $(INDEX_HTML) scripts/generate-docs-index.mjs
	mkdir -p $(@D)
	node scripts/generate-docs-index.mjs $(DOC_DIRS) > $@

$(foreach dir,$(DOC_DIRS),$(eval $(call DOC_RULE,$(dir))))

%/.agents: %/AGENTS.md
	mkdir -p $@
%/.agents/skills: %/.agents
	test -L $@ || (cd $< && ln -s ../../.agents/skills skills)
