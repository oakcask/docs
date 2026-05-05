PROJECT_AGENTS_MD = $(wildcard */AGENTS.md)
SKILLS_SYMLINKS = $(patsubst %/AGENTS.md,%/.agents/skills,$(PROJECT_AGENTS_MD))

%/.agents: %/AGENTS.md
	mkdir -p $@
%/.agents/skills: %/.agents
	test -L $@ || (cd $< && ln -s ../../.agents/skills skills)

.PHONY: all
all: $(SKILLS_SYMLINKS)
