FROM owasp/modsecurity:nginx-alpine

COPY modsecurity.conf /etc/nginx/modsec/modsecurity.conf

COPY ./nginx.conf /etc/nginx/templates/conf.d/default.conf.template


CMD ["nginx", "-g", "daemon off;"]
