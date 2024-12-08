FROM owasp/modsecurity-crs:4.9.0-nginx-202412020312

USER root

# Add SSL certificate generation
RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=TR/ST=State/L=City/O=Organization/CN=localhost"

COPY modsecurity.conf /etc/nginx/templates/modsecurity.d/modsecurity.conf.template
RUN mkdir /var/log/modsec
RUN touch /var/log/modsec/modsec_audit.log
RUN chmod 777 /var/log/modsec/modsec_audit.log
RUN chown nginx:nginx /var/log/modsec/modsec_audit.log

COPY default.conf /etc/nginx/templates/conf.d/default.conf.template

CMD ["nginx", "-g", "daemon off;"]
