# Script para limpiar y recrear la carta del restaurante
$headers = @{
    'Content-Type' = 'application/json'
}

# 1. Login como admin
$loginData = @{
    username = 'admin'
    password = '123456'
} | ConvertTo-Json

Write-Host "Iniciando sesion como admin..."
$response = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method POST -Headers $headers -Body $loginData
$token = $response.accessToken
Write-Host "Token obtenido exitosamente"

# Headers con autenticacion
$authHeaders = @{
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $token"
}

# 2. Obtener todos los productos para eliminar
Write-Host "Obteniendo lista de productos..."
$products = Invoke-RestMethod -Uri 'http://localhost:8080/api/products' -Method GET

# 3. Eliminar todos los productos existentes
Write-Host "Eliminando productos existentes..."
$count = 0
foreach ($product in $products) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8080/api/products/$($product.id)" -Method DELETE -Headers $authHeaders
        $count++
        if ($count % 50 -eq 0) {
            Write-Host "Eliminados $count productos..."
        }
    } catch {
        Write-Host "Error eliminando producto $($product.id): $($_.Exception.Message)"
    }
}
Write-Host "Total productos eliminados: $count"

# 4. Obtener todas las categorías para eliminar
Write-Host "Obteniendo lista de categorías..."
try {
    $categories = Invoke-RestMethod -Uri 'http://localhost:8080/api/categories' -Method GET
    
    # 5. Eliminar todas las categorías existentes
    Write-Host "Eliminando categorías existentes..."
    foreach ($category in $categories) {
        try {
            Invoke-RestMethod -Uri "http://localhost:8080/api/categories/$($category.id)" -Method DELETE -Headers $authHeaders
            Write-Host "Eliminada categoría: $($category.name)"
        } catch {
            Write-Host "Error eliminando categoría $($category.id): $($_.Exception.Message)"
        }
    }
} catch {
    Write-Host "No se pudieron obtener categorías o ya están vacías"
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
    $categoryData = $category | ConvertTo-Json
    try {
        $newCategory = Invoke-RestMethod -Uri 'http://localhost:8080/api/categories' -Method POST -Headers $authHeaders -Body $categoryData
        $createdCategories[$category.name] = $newCategory.id
        Write-Host "Creada categoría: $($category.name) con ID: $($newCategory.id)"
    } catch {
        Write-Host "Error creando categoría $($category.name): $($_.Exception.Message)"
    }
}

# 7. Crear los nuevos productos
Write-Host "Creando nuevos productos..."
$newProducts = @(
    # Barra Cevichera
    @{ name = "Ceviche Clásico"; price = 18.0; description = "Pescado fresco marinado en limón con cebolla, culantro, camote y choclo"; categoryId = $createdCategories["Barra Cevichera"] },
    @{ name = "Ceviche Mixto"; price = 25.0; description = "Pescado y mariscos frescos en leche de tigre con guarniciones tradicionales"; categoryId = $createdCategories["Barra Cevichera"] },
    @{ name = "Tiradito Nikkei"; price = 22.0; description = "Láminas de pescado bañadas en leche de tigre con toque oriental"; categoryId = $createdCategories["Barra Cevichera"] },
    @{ name = "Leche de Tigre"; price = 8.0; description = "Concentrado puro de ceviche servido en vaso"; categoryId = $createdCategories["Barra Cevichera"] },
    @{ name = "Causa Limeña"; price = 16.0; description = "Capas de papa amarilla con relleno de pollo o atún"; categoryId = $createdCategories["Barra Cevichera"] },
    
    # Entradas Calientes
    @{ name = "Chicharrón de Pescado"; price = 24.0; description = "Trozos de pescado crocantes acompañados de yuca frita"; categoryId = $createdCategories["Entradas Calientes"] },
    @{ name = "Jalea Mixta"; price = 32.0; description = "Selección de mariscos empanizados con salsa criolla"; categoryId = $createdCategories["Entradas Calientes"] },
    @{ name = "Anticuchos de Corazón"; price = 18.0; description = "Brochetas de corazón de res marinadas en ají panca"; categoryId = $createdCategories["Entradas Calientes"] },
    @{ name = "Choritos a la Chalaca"; price = 20.0; description = "Mejillones frescos con sarza de cebolla y limón"; categoryId = $createdCategories["Entradas Calientes"] },
    
    # Fondos Marinos y Criollos
    @{ name = "Arroz con Mariscos"; price = 28.0; description = "Arroz amarillo con mariscos frescos y culantro"; categoryId = $createdCategories["Fondos Marinos y Criollos"] },
    @{ name = "Pescado a la Plancha"; price = 26.0; description = "Filete de pescado grillado con ensalada fresca"; categoryId = $createdCategories["Fondos Marinos y Criollos"] },
    @{ name = "Sudado de Pescado"; price = 24.0; description = "Pescado cocido al vapor con yuca y salsa criolla"; categoryId = $createdCategories["Fondos Marinos y Criollos"] },
    @{ name = "Lomo Saltado"; price = 25.0; description = "Clásico plato peruano con carne, papas fritas y arroz"; categoryId = $createdCategories["Fondos Marinos y Criollos"] },
    @{ name = "Ají de Gallina"; price = 22.0; description = "Pollo deshilachado en crema de ají amarillo"; categoryId = $createdCategories["Fondos Marinos y Criollos"] },
    @{ name = "Chaufa de Mariscos"; price = 26.0; description = "Arroz frito estilo chino con mariscos variados"; categoryId = $createdCategories["Fondos Marinos y Criollos"] },
    
    # Rondas Para Compartir
    @{ name = "Piqueo Marino"; price = 45.0; description = "Tabla de chicharrones, ceviche y causas para compartir"; categoryId = $createdCategories["Rondas Para Compartir"] },
    @{ name = "Parrilla Mixta"; price = 55.0; description = "Carnes a la parrilla con guarniciones variadas (4-6 personas)"; categoryId = $createdCategories["Rondas Para Compartir"] },
    @{ name = "Festival Criollo"; price = 60.0; description = "Combinación de platos típicos peruanos para la mesa"; categoryId = $createdCategories["Rondas Para Compartir"] },
    
    # Bebidas
    @{ name = "Chicha Morada"; price = 8.0; description = "Bebida tradicional de maíz morado con frutas"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Limonada Frozen"; price = 10.0; description = "Limonada helada con hielo granizado"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Inca Kola 500ml"; price = 6.0; description = "Gaseosa dorada peruana"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Pisco Sour"; price = 15.0; description = "Cóctel bandera del Perú"; categoryId = $createdCategories["Bebidas"] },
    @{ name = "Cerveza Nacional"; price = 8.0; description = "Cerveza peruana 330ml"; categoryId = $createdCategories["Bebidas"] }
)

$productCount = 0
foreach ($product in $newProducts) {
    if ($product.categoryId -ne $null) {
        $productData = $product | ConvertTo-Json
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
Write-Host "Categorías creadas: $($createdCategories.Count)"
Write-Host "Productos creados: $productCount"
Write-Host "¡Carta nueva lista!"