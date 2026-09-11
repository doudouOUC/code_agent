#!/bin/bash
# Build 257 real Git repositories for the 4c8g workspace-capacity validation.
#
# Each workspace is a hardlink copy of one master repository whose working tree
# is the actual qwen-code source tree (real files, real content, real sizes), so
# git status / watcher / FD behaviour is representative. Hardlinks keep 257
# copies affordable on a 40G disk; every copy has its own directories and .git,
# and the harness only reads, so copies stay independent.
set -euo pipefail

ROOT=/root/cap
MASTER=$ROOT/master
REPOS=$ROOT/repos
COUNT=${1:-257}

export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1

# A background `gc --auto` from an earlier attempt keeps the object lock and
# fails the repack below; wait it out before touching the master repo.
while pgrep -f 'git gc' >/dev/null 2>&1; do sleep 2; done

rm -rf "$MASTER" "$REPOS"
mkdir -p "$MASTER" "$REPOS"

echo "--- materializing master working tree ---"
tar -cf - --exclude=node_modules --exclude=dist --exclude=.git -C /root/qwen-code . \
  | tar -xf - -C "$MASTER"

cd "$MASTER"
git init -q -b main .
git config gc.auto 0
git config user.name 'Capacity Experiment'
git config user.email 'capacity@example.invalid'
git add -A
git commit -q -m 'baseline: qwen-code source tree'
# A second commit plus refs make branch/log reads representative rather than
# a single-commit degenerate case.
printf '\n# capacity experiment marker\n' >> README.md
git commit -q -am 'capacity experiment marker'
for i in $(seq 1 15); do git branch -q "feature/branch-$i"; done
for i in $(seq 1 5); do git tag -a "v0.0.$i" -m "tag $i"; done
# Pack objects so each copy looks like a cloned repository instead of one with
# thousands of loose object files.
git repack -adq

echo "--- master stats ---"
echo "files: $(git ls-files | wc -l)"
echo "worktree size: $(du -sh --exclude=.git . | cut -f1)"
echo "git dir size: $(du -sh .git | cut -f1)"
echo "branches: $(git branch --list | wc -l)  tags: $(git tag | wc -l)"
git status --porcelain | head -3

echo "--- cloning $COUNT hardlink copies ---"
start=$(date +%s)
for i in $(seq 0 $((COUNT - 1))); do
  cp -al "$MASTER" "$REPOS/ws$(printf '%03d' "$i")"
done
echo "elapsed: $(( $(date +%s) - start ))s"

echo "--- verification ---"
echo "repos: $(ls "$REPOS" | wc -l)"
cd "$REPOS/ws000" && git status --porcelain | wc -l | xargs echo "ws000 dirty entries:"
cd "$REPOS/ws256" && git rev-parse --short HEAD | xargs echo "ws256 HEAD:"
df -h / | tail -1
df -i / | tail -1
