# Exploração de Dados de e-Commerce em Marketplaces Virtuais

Este repositório contêm uma análise de um dataset [disponível no Kaggle](https://www.kaggle.com/olistbr/brazilian-ecommerce) que detalha a situação do comércio virtual em marketplaces digitais no período de 2016 a 2018

## Como Executar

### Método 1 - Mais Fácil
---
Como esse repo faz uso do GitHub Pages, basta acessar https://fkeiler.github.io/ExploracaoECommerce

### Método 2 - Mais Complicado
---
Caso você queira rodar o repositório localmente a melhor solução seria rodar o Jekyll, o gerador de páginas por trás do GitHub Pages (porém talvez um servidor web como o do Python funcione, apesar de eu não ter testado). Para rodar o Jekyll é necessário ter o Ruby instalado, [cujo guia oficial descreve os vários métodos de instalação](https://www.ruby-lang.org/en/documentation/installation/). Com o Ruby instalado, é necessário instalar o bundler com:
```sh
gem install bundler
```
Uma vez instalado o bundler, basta ir à pasta contendo os arquivos deste website e rodar
```sh
bundle install
```
e, em seguida, rodar
```sh
bundle exec jekyll install
```
O site deve estar disponível em localhost:4000
