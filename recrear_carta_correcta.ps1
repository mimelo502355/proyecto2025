# Script para crear la carta completa con codificación correcta
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

# 2. Obtener todos los productos para eliminar
Write-Host "Obteniendo lista de productos..."
try {
    $products = Invoke-RestMethod -Uri 'http://localhost:8080/api/products' -Method GET

    # 3. Eliminar todos los productos existentes
    Write-Host "Eliminando productos existentes..."
    foreach ($product in $products) {
        try {
            Invoke-RestMethod -Uri "http://localhost:8080/api/products/$($product.id)" -Method DELETE -Headers $authHeaders
        } catch {
            # Ignorar errores de eliminación
        }
    }
    Write-Host "Productos existentes eliminados"
} catch {
    Write-Host "No hay productos para eliminar"
}

# 4. Obtener todas las categorías para eliminar
Write-Host "Obteniendo lista de categorías..."
try {
    $categories = Invoke-RestMethod -Uri 'http://localhost:8080/api/categories' -Method GET -Headers $authHeaders
    
    # 5. Eliminar todas las categorías existentes
    Write-Host "Eliminando categorías existentes..."
    foreach ($category in $categories) {
        try {
            Invoke-RestMethod -Uri "http://localhost:8080/api/categories/$($category.id)" -Method DELETE -Headers $authHeaders
        } catch {
            # Ignorar errores de eliminación
        }
    }
    Write-Host "Categorías existentes eliminadas"
} catch {
    Write-Host "No hay categorías para eliminar"
}

# 6. Crear las nuevas categorías
Write-Host "Creando nuevas categorías..."
$newCategories = @(
    @{ name = "Barra Cevichera" },
    @{ name = "Entradas Calientes" },
    @{ name = "Fondos Marinos y Criollos" },
    @{ name = "Rondas Para Compartir" },
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

# 7. Crear los nuevos productos con la carta especificada
Write-Host "Creando nuevos productos..."
$newProducts = @(
    # Barra Cevichera
    @{ name = "Ceviche Clasico"; price = 32.0; description = "Pesca del dia, leche de tigre tradicional, camote y choclo"; categoryId = $createdCategories["Barra Cevichera"] },
    @{ name = "Ceviche El Picante"; price = 35.0; description = "Mixto con crema de rocoto ahumado y chicharon de pota"; categoryId = $createdCategories["Barra Cevichera"] },
    @{ name = "Tiradito al Aji Amarillo"; price = 30.0; description = "Laminas de pescado en crema de aji amarillo y maiz chulpi"; categoryId = $createdCategories["Barra Cevichera"] },
    @{ name = "Leche de Tigre Levantate Lazaro"; price = 18.0; description = "Potente concentrado con trozos de pescado y mariscos"; categoryId = $createdCategories["Barra Cevichera"] },
    
    # Entradas Calientes
    @{ name = "Jalea Real"; price = 38.0; description = "Mixtura de mariscos y pescado crocante con salsa tartara y criolla"; categoryId = $createdCategories["Entradas Calientes"] },
    @{ name = "Causa Limena de Langostinos"; price = 24.0; description = "Papa amarilla prensada rellena de palta y langostinos en salsa golf"; categoryId = $createdCategories["Entradas Calientes"] },
    @{ name = "Wantanes de Pulpa de Cangrejo"; price = 22.0; description = "Fritos y servidos con salsa de tamarindo"; categoryId = $createdCategories["Entradas Calientes"] },
    
    # Fondos Marinos y Criollos
    @{ name = "Arroz con Mariscos El Picante"; price = 36.0; description = "Arroz meloso al wok con frutos del mar y toque de parmesano"; categoryId = $createdCategories["Fondos Marinos y Criollos"] },
    @{ name = "Tacu Tacu en Salsa de Mariscos"; price = 38.0; description = "Frijol y arroz dorado cubierto con cremosa salsa de mariscos"; categoryId = $createdCategories["Fondos Marinos y Criollos"] },
    @{ name = "Lomo Saltado Clasico"; price = 40.0; description = "Trozos de lomo fino al wok, cebolla, tomate, papas fritas y arroz"; categoryId = $createdCategories["Fondos Marinos y Criollos"] },
    @{ name = "Chaufa Amazonico con Cecina"; price = 34.0; description = "Arroz chaufa con cecina, platano maduro y huevo"; categoryId = $createdCategories["Fondos Marinos y Criollos"] },
    
    # Rondas Para Compartir
    @{ name = "Ronda Fria"; price = 55.0; description = "Ceviche clasico + Causa de pulpo + Tiradito bicolor"; categoryId = $createdCategories["Rondas Para Compartir"] },
    @{ name = "Ronda Caliente"; price = 60.0; description = "Arroz con mariscos + Chicharon de pescado + Chaufa de mariscos"; categoryId = $createdCategories["Rondas Para Compartir"] },
    
    # Bebidas
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

Write-Host "`n=== RESUMEN ==="
Write-Host "Categorias creadas: $($createdCategories.Count)"
Write-Host "Productos creados: $productCount"
Write-Host "¡Carta nueva lista sin errores de codificacion!"