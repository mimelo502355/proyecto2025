import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RUCData {
    numero: string;
    razonSocial?: string;
    nombre?: string;
    estado?: string;
    condicion?: string;
    ubigeo?: string;
    direccion?: string;
}

export interface DNIData {
    numero: string;
    nombre?: string;
    apellidos?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    nombres?: string;
    genero?: string;
}

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private apiUrl = 'http://localhost:8080/api/documents';

    constructor(private http: HttpClient) { }

    /**
     * Consulta RUC en el backend
     */
    consultarRUC(ruc: string): Observable<RUCData> {
        return this.http.get<RUCData>(`${this.apiUrl}/consultar-ruc/${ruc}`);
    }

    /**
     * Consulta DNI en el backend
     */
    consultarDNI(dni: string): Observable<DNIData> {
        return this.http.get<DNIData>(`${this.apiUrl}/consultar-dni/${dni}`);
    }

    /**
     * Valida formato de RUC
     */
    isValidRUC(ruc: string): boolean {
        return /^\d{11}$/.test(ruc);
    }

    /**
     * Valida formato de DNI
     */
    isValidDNI(dni: string): boolean {
        return /^\d{8}$/.test(dni);
    }
}
