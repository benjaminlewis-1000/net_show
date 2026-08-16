FROM node:24-alpine

# Create app directory
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

# Install app dependencies. Copying just the manifest files first (from
# project_root/, since that's where they now live) lets Docker cache
# this layer separately from source changes - editing App.jsx won't
# force a full npm ci re-run, only editing package.json will.
COPY project_root/package*.json ./

RUN npm ci

# Bundle the rest of the app source
COPY project_root/. .

RUN echo "#! /bin/sh " >> /start.sh \
&& echo "" >> /start.sh \
&& echo "npm run build " >> /start.sh \
&& echo "" >> /start.sh \
&& echo "serve -s dist -l 5000"  >> /start.sh \
&& echo "while true; do" >> /start.sh \
&& echo "   sleep 10" >> /start.sh \
&& echo "done " >> /start.sh

# 3000 = vite dev server (see vite.config.js), 5000 = production `serve`
# (explicitly pinned above with -l 5000 to match docker-compose.yml's
# port mapping and the Traefik label, both of which expect 5000).
EXPOSE 3000 5000

CMD [ "/bin/sh", "/start.sh" ]