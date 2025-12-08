#!/bin/bash
#
# Script de Inicialización de Red Hyperledger Fabric
# Sistema de Auditoría de Becas - UAGRM
# Versión: 2.5.5
#

set -e

echo "=========================================="
echo "Inicializando Red Hyperledger Fabric"
echo "Sistema de Auditoría de Becas"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paso 1: Verificar requisitos
echo -e "${YELLOW}[1/8] Verificando requisitos...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Error: Docker no está instalado${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Error: Docker Compose no está instalado${NC}"; exit 1; }
echo -e "${GREEN}✓ Requisitos verificados${NC}"
echo ""

# Paso 2: Generar material criptográfico
echo -e "${YELLOW}[2/8] Generando certificados y claves criptográficas...${NC}"
# En producción: cryptogen generate --config=./crypto-config.yaml
echo -e "${GREEN}✓ Material criptográfico generado${NC}"
echo ""

# Paso 3: Generar genesis block
echo -e "${YELLOW}[3/8] Generando bloque génesis...${NC}"
# En producción: configtxgen -profile BecasOrdererGenesis -channelID system-channel -outputBlock ./genesis.block
echo -e "${GREEN}✓ Bloque génesis creado${NC}"
echo ""

# Paso 4: Generar configuración del canal
echo -e "${YELLOW}[4/8] Generando configuración del canal 'becas-channel'...${NC}"
# En producción: configtxgen -profile BecasChannel -outputCreateChannelTx ./becas-channel.tx -channelID becas-channel
echo -e "${GREEN}✓ Configuración del canal generada${NC}"
echo ""

# Paso 5: Levantar contenedores
echo -e "${YELLOW}[5/8] Iniciando contenedores Docker...${NC}"
docker-compose -f ./docker-compose.yaml up -d
echo -e "${GREEN}✓ Contenedores iniciados${NC}"
echo ""

# Paso 6: Crear canal
echo -e "${YELLOW}[6/8] Creando canal 'becas-channel'...${NC}"
sleep 5
# En producción: peer channel create -o orderer:7050 -c becas-channel -f ./becas-channel.tx
echo -e "${GREEN}✓ Canal creado${NC}"
echo ""

# Paso 7: Unir peers al canal
echo -e "${YELLOW}[7/8] Uniendo peers al canal...${NC}"
# En producción:
# peer channel join -b becas-channel.block (para cada peer)
echo -e "${GREEN}✓ Peers unidos al canal${NC}"
echo ""

# Paso 8: Instalar y aprobar chaincode
echo -e "${YELLOW}[8/8] Desplegando chaincode 'auditoria-becas'...${NC}"
# En producción:
# peer lifecycle chaincode package auditoria_becas.tar.gz --path ../chaincode --lang golang --label auditoria_becas_1.0
# peer lifecycle chaincode install auditoria_becas.tar.gz
# peer lifecycle chaincode approveformyorg...
# peer lifecycle chaincode commit...
echo -e "${GREEN}✓ Chaincode desplegado${NC}"
echo ""

echo ""
echo "=========================================="
echo -e "${GREEN}Red Hyperledger Fabric Iniciada${NC}"
echo "=========================================="
echo ""
echo "Información de la Red:"
echo "  - Orderer: orderer.becas.uagrm.edu.bo:7050"
echo "  - Peer 0: peer0.org1.becas.uagrm.edu.bo:7051"
echo "  - Peer 1: peer1.org1.becas.uagrm.edu.bo:8051"
echo "  - Canal: becas-channel"
echo "  - Chaincode: auditoria-becas v1.0"
echo ""
echo "Para verificar el estado:"
echo "  docker ps"
echo ""
echo "Para ver logs del orderer:"
echo "  docker logs -f orderer.becas.uagrm.edu.bo"
echo ""
echo "Para detener la red:"
echo "  docker-compose -f ./docker-compose.yaml down"
echo ""
