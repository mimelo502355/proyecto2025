# Script para crear la carta optimizada con 4 categorías principales
$headers = @{
    'Content-Type' = 'application/json; charset=utf-8'
}

# 1. Login como admin
$loginData = @{
    username = 'admin'
    password = '123456'
} | ConvertTo-Json

Write-Host "Iniciando sesión como admin..."
$response = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method POST -Headers $headers -Body $loginData
$token = $response.accessToken
Write-Host "Token obtenido exitosamente"

# Headers con autenticación
$authHeaders = @{
    'Content-Type' = 'application/json; charset=utf-8'
    'Authorization' = "Bearer $token"
}

# 2. Limpiar productos existentes
Write-Host "Limpiando productos existentes..."
try {
    $products = Invoke-RestMethod -Uri 'http://localhost:8080/api/products' -Method GET
    foreach ($product in $products) {
        try {
            Invoke-RestMethod -Uri "http://localhost:8080/api/products/$($product.id)" -Method DELETE -Headers $authHeaders
        } catch { }
    }
} catch { }

# 3. Limpiar categorías existentes
Write-Host "Limpiando categorías existentes..."
try {
    $categories = Invoke-RestMethod -Uri 'http://localhost:8080/api/categories' -Method GET -Headers $authHeaders
    foreach ($category in $categories) {
        try {
            Invoke-RestMethod -Uri "http://localhost:8080/api/categories/$($category.id)" -Method DELETE -Headers $authHeaders
        } catch { }
    }
} catch { }

# 4. Crear las 4 nuevas categorías optimizadas
Write-Host "Creando categorías optimizadas..."
$newCategories = @(
    @{ name = "Ceviches y Causas" },
    @{ name = "Duos y Trios Marinos" },
    @{ name = "Especialidades y Parrillas" },
    @{ name = "Arroces y Combinados" },
    @{ name = "Bebidas" }
)

$createdCategories = @{}
foreach ($category in $newCategories) {
    $categoryData = $category | ConvertTo-Json -Depth 3
    try {
        $newCategory = Invoke-RestMethod -Uri 'http://localhost:8080/api/categories' -Method POST -Headers $authHeaders -Body $categoryData
        $createdCategories[$category.name] = $newCategory.id
        Write-Host "Creada categoría: $($category.name) con ID: $($newCategory.id)"
    } catch {
        Write-Host "Error creando categoría $($category.name): $($_.Exception.Message)"
    }
}

# 5. Crear los productos según la nueva estructura optimizada
Write-Host "Creando productos optimizados..."
$newProducts = @(
    # CEVICHES Y CAUSAS (Entradas Frías)
    @{ name = "Ceviche El Picante"; price = 30.0; description = "Perico en crema de rocoto"; categoryId = $createdCategories["Ceviches y Causas"] },
    @{ name = "Ceviche Mixto"; price = 30.0; description = "Pescado y mixtura"; categoryId = $createdCategories["Ceviches y Causas"] },
    @{ name = "Ceviche Carretillero"; price = 28.0; description = "Jurel + Chicharon de pota"; categoryId = $createdCategories["Ceviches y Causas"] },
    @{ name = "Causa con Langostinos Fritos"; price = 28.0; description = "Papa amarilla rellena con langostinos crocantes"; categoryId = $createdCategories["Ceviches y Causas"] },
    @{ name = "Causa Duo 2"; price = 28.0; description = "Causa con Ceviche"; categoryId = $createdCategories["Ceviches y Causas"] },
    @{ name = "Trio Bravo"; price = 35.0; description = "Ceviche + Arroz con Mariscos + Causa"; categoryId = $createdCategories["Ceviches y Causas"] },
    
    # DÚOS Y TRÍOS MARINOS (Los Favoritos)
    @{ name = "Duo Marino 1"; price = 30.0; description = "Ceviche + Arroz con Mariscos"; categoryId = $createdCategories["Duos y Trios Marinos"] },
    @{ name = "Duo Marino 2"; price = 27.0; description = "Ceviche + Chaufa de Mariscos"; categoryId = $createdCategories["Duos y Trios Marinos"] },
    @{ name = "Duo Marino 3"; price = 32.0; description = "Ceviche + Chicharon de Pescado"; categoryId = $createdCategories["Duos y Trios Marinos"] },
    @{ name = "Duo Marino 4"; price = 28.0; description = "Ceviche + Chicharon de Pota"; categoryId = $createdCategories["Duos y Trios Marinos"] },
    @{ name = "Duo Peruanazo"; price = 35.0; description = "Arroz con Mariscos + Chicharon"; categoryId = $createdCategories["Duos y Trios Marinos"] },
    @{ name = "Trio Marino 1"; price = 37.0; description = "Ceviche + Chicharon + Arroz"; categoryId = $createdCategories["Duos y Trios Marinos"] },
    @{ name = "Trio Marino 2"; price = 37.0; description = "Ceviche + Chicharon + Chaufa"; categoryId = $createdCategories["Duos y Trios Marinos"] },
    @{ name = "Trio El Picante 1"; price = 35.0; description = "Ceviche + Chicharon Pota + Arroz"; categoryId = $createdCategories["Duos y Trios Marinos"] },
    @{ name = "Trio El Picante 2"; price = 35.0; description = "Ceviche + Chicharon Pota + Chaufa"; categoryId = $createdCategories["Duos y Trios Marinos"] },
    
    # ESPECIALIDADES Y PARRILLAS (Criollos y Fuego)
    @{ name = "Chancho al Palo"; price = 35.0; description = "Con papas y ensalada"; categoryId = $createdCategories["Especialidades y Parrillas"] },
    @{ name = "Arroz con Pato Norteno"; price = 30.0; description = "Especialidad nortena tradicional"; categoryId = $createdCategories["Especialidades y Parrillas"] },
    @{ name = "Arroz con Pato y Ceviche"; price = 35.0; description = "Combinacion perfecta del norte"; categoryId = $createdCategories["Especialidades y Parrillas"] },
    @{ name = "Pulpo a la Parrilla - Trio"; price = 45.0; description = "Con Causa y Langostinos"; categoryId = $createdCategories["Especialidades y Parrillas"] },
    @{ name = "Pulpo a la Parrilla - Duo"; price = 40.0; description = "Con Espagueti Huancaina"; categoryId = $createdCategories["Especialidades y Parrillas"] },
    @{ name = "Pulpo a la Parrilla Clasico"; price = 40.0; description = "Con Langostino y Choclo"; categoryId = $createdCategories["Especialidades y Parrillas"] },
    
    # ARROCES Y COMBINADOS (Contundentes)
    @{ name = "Arroz con Mariscos"; price = 30.0; description = "Arroz amarillo con frutos del mar"; categoryId = $createdCategories["Arroces y Combinados"] },
    @{ name = "Chaufa de Mariscos"; price = 26.0; description = "Arroz frito oriental con mariscos"; categoryId = $createdCategories["Arroces y Combinados"] },
    @{ name = "Combinado Picantero 7 Colores"; price = 22.0; description = "Chanfainita, Tallarin, Ceviche y mas"; categoryId = $createdCategories["Arroces y Combinados"] },
    @{ name = "Cuadro Criollazo"; price = 28.0; description = "Arroz, Ceviche, Chanfainita, Tallarin"; categoryId = $createdCategories["Arroces y Combinados"] },
    
    # BEBIDAS (Se mantiene)
    @{ name = "Chicha Morada (Tarro)"; price = 12.0; description = "Bebida tradicional peruana"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Chicha de Maracuya (Tarro)"; price = 12.0; description = "Refrescante chicha de maracuya"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Gaseosa Personal"; price = 2.5; description = "Gaseosa individual"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Gaseosa 1 Litro"; price = 10.0; description = "Gaseosa de 1 litro"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Gaseosa Gordita-Jumbo"; price = 5.0; description = "Gaseosa tamano mediano"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Gaseosa 2.5L"; price = 15.0; description = "Gaseosa familiar 2.5 litros"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Agua Mineral 500ml"; price = 2.5; description = "Agua mineral sin gas"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Cerveza Pilsen 630ml"; price = 10.0; description = "Cerveza rubia nacional"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Cerveza Trigo 620ml"; price = 10.0; description = "Cerveza de trigo"; categoryId = $createdCategories["Bebidas"] }
)

$productCount = 0
foreach ($product in $newProducts) {
    if ($product.categoryId -ne $null) {
        $productData = $product | ConvertTo-Json -Depth 3
        try {
            $newProduct = Invoke-RestMethod -Uri 'http://localhost:8080/api/products' -Method POST -Headers $authHeaders -Body $productData
            $productCount++
            Write-Host "Creado producto: $($product.name) - S/ $($product.price)"
        } catch {
            Write-Host "Error creando producto $($product.name): $($_.Exception.Message)"
        }
    }
}

Write-Host "`n=== RESUMEN OPTIMIZACION ==="
Write-Host "Categorias creadas: $($createdCategories.Count)"
Write-Host "Productos creados: $productCount"
Write-Host "¡Carta optimizada con 4 categorias principales lista!"

# 6. Mostrar resumen por categorías
Write-Host "`n=== ESTRUCTURA OPTIMIZADA ==="
foreach ($category in $newCategories) {
    if ($category.name -ne "Bebidas") {
        $categoryProducts = $newProducts | Where-Object { $_.categoryId -eq $createdCategories[$category.name] -and $_.categoryId -ne $createdCategories["Bebidas"] }
        Write-Host "`n$($category.name.ToUpper()) ($($categoryProducts.Count) productos)"
        foreach ($product in $categoryProducts) {
            Write-Host "  - $($product.name) - S/ $($product.price)"
        }
    }
}

$bebidaProducts = $newProducts | Where-Object { $_.categoryId -eq $createdCategories["Bebidas"] }
Write-Host "`nBEBIDAS ($($bebidaProducts.Count) productos)"
Write-Host "  - Desde S/ 2.50 hasta S/ 15.00"