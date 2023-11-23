---
title: "Managing multiple python versions with Homebrew and Poetry"
date: 2022-11-14T14:56:06Z
draft: false
tags: til, python, development, mac
---

## tl;dr

* `brew install python@<pythonversion>` to install multiple python versions
* `poetry env use <pythonversion>` to create virtual environment
* direnv to automatically switch on entering directory

---

I've always felt a bit hesitant to try out new tools for managing my python development environments. I had been safe and happy in the antiquated but efficient pip + virtualenv + pyenv world, and had been [burned before](https://pipenv.pypa.io/en/latest/) when I dared adventure beyond the path of the tried and true of old. Yes, I didn't have fancy colorized terminal output, but it worked.

But then I got myself a Mac M1, and that put some brakes in my workflow, slowing it down just enough to justify spending the effort to update my ways. So I found that [Poetry](https://python-poetry.org/), together with [Homebrew](https://brew.sh/), is a decent solution to the problem of managing multiple environments of a project, and makes it trivial to support different python versions at the same time.

## Install multiple python versions
Simply using homebrew, you can have multiple working python versions in your system at once:

```bash
$ brew install python@3.9
$ brew install python@3.11
...
```

(version 3.7 and below are not supported in the M1 Mac however)

Each version will install symlinks in `/opt/homebrew/bin` (default path for Mac M1, might be different in other systems) and you can refer directly to the binary of the individual minor version numbers, e.g. `python3.9` or `python3.11`.

This setup is super simple and easy to use, but unlike with [pyenv](https://github.com/pyenv/pyenv), you can only specify major+minor version, and not the patch number (e.g., 3.10, not 3.10.5). You'll just get the latest patch version for each major+minor that's been built for homebrew. For similar reasons, you can't install development versions (betas, pre-releases etc).

## Poetry to manage your python environment

Assuming you have a recent version of poetry installed globally already (shouldn't matter in which version of python you installed it), you can just define the version of python you want when you first initialize the environment.

```bash
$ cd my-project
$ poetry init -n --python="*" # in case there is no pyproject.toml already, it creates one with loose py version

$ poetry env use 3.10 # looks for python3.10 in the PATH, and create a virtual env from that
Creating virtualenv my-project-QXbwbAtx-py3.10 in <REDACTED>/pypoetry/virtualenvs
Using virtualenv: <REDACTED>/pypoetry/virtualenvs/my-project-QXbwbAtx-py3.10

$ poetry install 
```

If you want to switch to a different python environment just use the `poetry env use` command again. You maybe have to reinstall the packages in the new environment, and likely redo the lock file because the compatible versions of your dependencies may change.

```bash
$ poetry env use 3.11
Creating virtualenv my-project-QXbwbAtx-py3.11 in <REDACTED>/pypoetry/virtualenvs
Using virtualenv: <REDACTED>/pypoetry/virtualenvs/my-project-QXbwbAtx-py3.11

$ poetry install
```

To execute a python script in the latest environment you selected, you can do `poetry run python <script>`. Alternatively, run `poetry shell` to start a new shell session in this environment.


## Bonus: automatically activate poetry environment with direnv

If you know [direnv](https://direnv.net/), you know where this is going. If not, you're in for a treat! direnv is a neat little shell tool that allows you to set environment variables or execute commands upon changing into any directory. You can also use it to automatically activate the poetry environment so you don't need to keep typing `poetry run/shell`

First you need to add a poetry hook for direnv. Edit your `$HOME/.direnvrc` and add this

```
layout_poetry() {
  if [[ ! -f pyproject.toml ]]; then
    log_error 'No pyproject.toml found. Use `poetry new` or `poetry init` to create one first.'
    exit 2
  fi

  # create venv if it doesn't exist
  poetry run true

  export VIRTUAL_ENV=$(poetry env info --path)
  export POETRY_ACTIVE=1
  PATH_add "$VIRTUAL_ENV/bin"
}
```

Now you can use the `layout poetry` command in direnv, like so:

```bash
$ cd my-project
$ echo 'layout poetry' >> .envrc
$ direnv allow 
```

Now every time you enter your project's directory, poetry will automatically activate the environment:

```bash
$ cd my-project
direnv: loading /private/tmp/my-project/.envrc
direnv: export +POETRY_ACTIVE +VIRTUAL_ENV ~PATH
$ which python # no need to run poetry shell
<REDACTED>/pypoetry/virtualenvs/my-project-QXbwbAtx-py3.10/bin/python
```

(Notice that if you change your poetry env, you have to exit and re-enter the project directory for it to recognize the new python executable)

I love direnv, but unfortunately find this auto activation of poetry too slow for my tastes (a couple of seconds in my experience, which is weird), so I don't currently use it, and prefer to run `poetry run` manually.

