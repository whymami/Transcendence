# OWASP ModSecurity'yi NGINX ile çalıştıran temel görüntü
FROM owasp/modsecurity:nginx-alpine

# ModSecurity konfigürasyon dosyasını kopyala
COPY modsecurity.conf /etc/nginx/modsec/modsecurity.conf

# NGINX yapılandırma dosyasını şablon olarak kopyala
COPY ./nginx.conf /etc/nginx/templates/conf.d/default.conf.template

# Gerekli izinleri ayarla
RUN mkdir -p /var/log/modsec && \
    chmod -R 755 /var/log/modsec && \
    touch /var/log/modsec/modsec_audit.log && \
    chmod -R 777 /var/log/modsec/modsec_audit.log && \
    chown nginx:nginx /var/log/modsec

# NGINX'i başlat
CMD ["nginx", "-g", "daemon off;"]
