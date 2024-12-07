listener "tcp" {
  address     = "0.0.0.0:8300"
  tls_disable = "true" 
}

storage "file" {
  path  = "/vault/data"
}

api_addr = "http://vault:8300" 
