/*
 * Chaincode de Auditoría para Becas
 * Hyperledger Fabric 2.5.5
 * 
 * Este chaincode gestiona el registro inmutable de eventos
 * del sistema de becas en el ledger distribuido.
 */

package main

import (
    "encoding/json"
    "fmt"
    "time"

    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract proporciona funciones para gestionar eventos de becas
type SmartContract struct {
    contractapi.Contract
}

// EventoBeca representa un evento registrado en el blockchain
type EventoBeca struct {
    ID              string            `json:"id"`
    Tipo            string            `json:"tipo"`
    PostulacionID   string            `json:"postulacion_id"`
    UsuarioID       string            `json:"usuario_id"`
    UsuarioNombre   string            `json:"usuario_nombre"`
    Datos           map[string]interface{} `json:"datos"`
    Metadata        map[string]interface{} `json:"metadata"`
    Timestamp       string            `json:"timestamp"`
    BlockNumber     int               `json:"block_number"`
    TransactionID   string            `json:"transaction_id"`
}

// InitLedger inicializa el ledger con datos de ejemplo
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
    fmt.Println("Inicializando ledger de auditoría de becas...")
    return nil
}

// RegistrarEvento registra un nuevo evento en el blockchain
func (s *SmartContract) RegistrarEvento(
    ctx contractapi.TransactionContextInterface,
    id string,
    tipo string,
    postulacionID string,
    usuarioID string,
    usuarioNombre string,
    datosJSON string,
) error {
    
    // Verificar que el evento no exista
    exists, err := s.EventoExists(ctx, id)
    if err != nil {
        return err
    }
    if exists {
        return fmt.Errorf("el evento %s ya existe", id)
    }

    // Parse datos JSON
    var datos map[string]interface{}
    err = json.Unmarshal([]byte(datosJSON), &datos)
    if err != nil {
        return fmt.Errorf("error al parsear datos: %v", err)
    }

    // Obtener ID de transacción
    txID := ctx.GetStub().GetTxID()

    // Crear evento
    evento := EventoBeca{
        ID:            id,
        Tipo:          tipo,
        PostulacionID: postulacionID,
        UsuarioID:     usuarioID,
        UsuarioNombre: usuarioNombre,
        Datos:         datos,
        Metadata:      make(map[string]interface{}),
        Timestamp:     time.Now().Format(time.RFC3339),
        TransactionID: txID,
    }

    // Serializar a JSON
    eventoJSON, err := json.Marshal(evento)
    if err != nil {
        return err
    }

    // Guardar en el ledger
    return ctx.GetStub().PutState(id, eventoJSON)
}

// ConsultarEvento consulta un evento por ID
func (s *SmartContract) ConsultarEvento(
    ctx contractapi.TransactionContextInterface,
    id string,
) (*EventoBeca, error) {
    
    eventoJSON, err := ctx.GetStub().GetState(id)
    if err != nil {
        return nil, fmt.Errorf("error al leer evento: %v", err)
    }
    if eventoJSON == nil {
        return nil, fmt.Errorf("evento %s no existe", id)
    }

    var evento EventoBeca
    err = json.Unmarshal(eventoJSON, &evento)
    if err != nil {
        return nil, err
    }

    return &evento, nil
}

// ObtenerHistorial obtiene todos los eventos de una postulación
func (s *SmartContract) ObtenerHistorial(
    ctx contractapi.TransactionContextInterface,
    postulacionID string,
) ([]*EventoBeca, error) {
    
    // Query en CouchDB (si está habilitado)
    queryString := fmt.Sprintf(`{
        "selector": {
            "postulacion_id": "%s"
        },
        "sort": [{"timestamp": "asc"}]
    }`, postulacionID)

    resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
    if err != nil {
        return nil, err
    }
    defer resultsIterator.Close()

    var eventos []*EventoBeca
    for resultsIterator.HasNext() {
        queryResponse, err := resultsIterator.Next()
        if err != nil {
            return nil, err
        }

        var evento EventoBeca
        err = json.Unmarshal(queryResponse.Value, &evento)
        if err != nil {
            return nil, err
        }
        eventos = append(eventos, &evento)
    }

    return eventos, nil
}

// EventoExists verifica si un evento existe
func (s *SmartContract) EventoExists(
    ctx contractapi.TransactionContextInterface,
    id string,
) (bool, error) {
    
    eventoJSON, err := ctx.GetStub().GetState(id)
    if err != nil {
        return false, fmt.Errorf("error al verificar evento: %v", err)
    }

    return eventoJSON != nil, nil
}

// ObtenerTodosEventos retorna todos los eventos (paginado)
func (s *SmartContract) ObtenerTodosEventos(
    ctx contractapi.TransactionContextInterface,
) ([]*EventoBeca, error) {
    
    resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
    if err != nil {
        return nil, err
    }
    defer resultsIterator.Close()

    var eventos []*EventoBeca
    for resultsIterator.HasNext() {
        queryResponse, err := resultsIterator.Next()
        if err != nil {
            return nil, err
        }

        var evento EventoBeca
        err = json.Unmarshal(queryResponse.Value, &evento)
        if err != nil {
            return nil, err
        }
        eventos = append(eventos, &evento)
    }

    return eventos, nil
}

func main() {
    chaincode, err := contractapi.NewChaincode(&SmartContract{})
    if err != nil {
        fmt.Printf("Error creando chaincode de auditoría: %v", err)
        return
    }

    if err := chaincode.Start(); err != nil {
        fmt.Printf("Error iniciando chaincode: %v", err)
    }
}
