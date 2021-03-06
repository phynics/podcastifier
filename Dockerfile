FROM node:boron
ENV DEBIAN_FRONTEND=noninteractive
RUN uname -rs
RUN echo "\ndeb http://www.deb-multimedia.org jessie main non-free \ndeb-src http://www.deb-multimedia.org jessie main non-free\n" >> /etc/apt/sources.list
RUN apt-get update
RUN apt-get -y install software-properties-common
RUN apt-get upgrade -y --force-yes
RUN apt-get -y --force-yes install ffmpeg
WORKDIR /usr/src/app
COPY package.json .
COPY ytdata/ ytdata/
RUN npm install
COPY dist/ dist/
EXPOSE 8080
CMD ["node", "dist/app.js"]
