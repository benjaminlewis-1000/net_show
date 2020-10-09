FROM node:13.12.0-alpine

# Create app directory
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

RUN echo "#! /bin/sh " >> /start.sh \ 
&& echo "" >> /start.sh \
&& echo "npm run build " >> /start.sh \
&& echo "" >> /start.sh \
&& echo "serve -s build"  >> /start.sh \
#&& echo "pm2 start npm -- start" >> /start.sh \
#&& echo "" >> /start.sh \ 
&& echo "while true; do" >> /start.sh \
&& echo "   sleep 10" >> /start.sh \
&& echo "done " >> /start.sh

EXPOSE 8080

CMD [ "/bin/sh" "/start.sh" ]
