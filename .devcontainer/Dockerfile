# check docker alpine version - https://hub.docker.com/_/alpine
# check available packages - https://pkgs.alpinelinux.org/packages

FROM alpine:3.15.4

RUN apk update \
    && apk add --no-cache nodejs="16.14.2-r0" npm="8.1.3-r0" \
    && apk add --no-cache git openssh-client \
    && apk add --no-cache zsh curl gnupg

# Update the npm version because
# npm 8.1.3 does not support autocompletion of script cmds (verison bug).
RUN npm install -g npm@8.6.0

# use zsh https://github.com/ohmyzsh/ohmyzsh
# show installed shell through `echo $SHELL`
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
RUN sed -i -e "s/bin\/ash/bin\/zsh/" /etc/passwd
