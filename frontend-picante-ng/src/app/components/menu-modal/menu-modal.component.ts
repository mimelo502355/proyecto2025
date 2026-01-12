import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  NgZone,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Category, Product } from '../../services/product';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-menu-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './menu-modal.component.html',
  styleUrls: ['./menu-modal.component.css']
})
export class MenuModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() editMode: boolean = true;
  @Output() close = new EventEmitter<void>();

  private productService = inject(ProductService);
  private ngZone = inject(NgZone);

  // Estado
  categories: Category[] = [];
  products: Product[] = [];

  // UI - Categorías
  newCategoryName: string = '';
  newCategoryDescription: string = '';
  showAddCategoryForm: boolean = false;
  editingCategoryId: number | null = null;
  editingCategoryName: string = '';
  editingCategoryDescription: string = '';

  // UI - Productos
  newProductName: string = '';
  newProductPrice: number = 0;
  newProductCategoryId: number | null = null;
  showAddProductForm: boolean = false;
  editingProductId: number | null = null;
  editingProductName: string = '';
  editingProductPrice: number = 0;
  editingProductCategoryId: number | null = null;
  selectedProductIds: Set<number> = new Set(); // Para selección múltiple

  // UI - Vistas
  activeTab: number = 0;
  searchQuery: string = '';
  viewMode: 'edit' | 'preview' = 'edit'; // Modo interno de visualización

  private hasLoaded = false;

  ngOnInit(): void {
    // Loaded by ngOnChanges
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && !this.hasLoaded) {
      this.hasLoaded = true;
      this.loadData();
    }
  }

  private loadData(): void {
    this.ngZone.runOutsideAngular(() => {
      Promise.all([
        this.productService.getCategories(),
        this.productService.getProducts()
      ]).then(([categories, products]) => {
        this.ngZone.run(() => {
          this.categories = categories;
          this.products = products;
        });
      }).catch((error: any) => {
        this.ngZone.run(() => {
          console.error('Error cargando datos:', error);
        });
      });
    });
  }

  // CATEGORÍAS

  toggleAddCategoryForm(): void {
    this.showAddCategoryForm = !this.showAddCategoryForm;
    if (!this.showAddCategoryForm) {
      this.resetCategoryForm();
    }
  }

  private resetCategoryForm(): void {
    this.newCategoryName = '';
    this.newCategoryDescription = '';
    this.editingCategoryId = null;
    this.editingCategoryName = '';
    this.editingCategoryDescription = '';
  }

  addCategory(): void {
    if (!this.newCategoryName.trim()) {
      alert('El nombre de la categoría es requerido');
      return;
    }

    this.productService.createCategory({ 
      name: this.newCategoryName,
      description: this.newCategoryDescription 
    }).subscribe({
      next: (response: any) => {
        this.categories.push({
          id: response.id,
          name: this.newCategoryName,
          description: this.newCategoryDescription
        });
        // Invalidar caché de productos para refrescar en todas las vistas
        this.productService.invalidateCache();
        this.resetCategoryForm();
        this.showAddCategoryForm = false;
      },
      error: (err: any) => {
        console.error('Error al añadir categoría:', err);
        alert('Error al añadir la categoría');
      }
    });
  }

  startEditCategory(cat: Category): void {
    this.editingCategoryId = cat.id;
    this.editingCategoryName = cat.name;
    this.editingCategoryDescription = cat.description || '';
  }

  saveEditCategory(): void {
    if (!this.editingCategoryName.trim() || this.editingCategoryId === null) {
      alert('El nombre es requerido');
      return;
    }

    this.productService.updateCategory(this.editingCategoryId, {
      name: this.editingCategoryName,
      description: this.editingCategoryDescription
    }).subscribe({
      next: () => {
        const cat = this.categories.find(c => c.id === this.editingCategoryId);
        if (cat) {
          cat.name = this.editingCategoryName;
          cat.description = this.editingCategoryDescription;
        }
        this.resetCategoryForm();
      },
      error: (err: any) => {
        console.error('Error al actualizar:', err);
        alert('Error al actualizar la categoría');
      }
    });
  }

  cancelEditCategory(): void {
    this.editingCategoryId = null;
    this.editingCategoryName = '';
  }

  deleteCategory(categoryId: number): void {
    if (!confirm('¿Confirma eliminación?')) return;

    // Actualización optimista de la UI
    const categoriesBackup = [...this.categories];
    const productsBackup = [...this.products];
    this.categories = this.categories.filter(c => c.id !== categoryId);
    this.products = this.products.filter(p => p.category?.id !== categoryId);

    this.productService.deleteCategory(categoryId).subscribe({
      next: () => {
        // Ya actualizado - solo confirmación
        console.log('Categoría eliminada exitosamente');
      },
      error: (err: any) => {
        // Restaurar en caso de error
        this.categories = categoriesBackup;
        this.products = productsBackup;
        console.error('Error al eliminar:', err);
        alert('Error al eliminar la categoría');
      }
    });
  }

  // PRODUCTOS

  toggleAddProductForm(): void {
    this.showAddProductForm = !this.showAddProductForm;
    if (!this.showAddProductForm) {
      this.resetProductForm();
    }
  }

  private resetProductForm(): void {
    this.newProductName = '';
    this.newProductPrice = 0;
    this.newProductCategoryId = null;
    this.editingProductId = null;
    this.editingProductName = '';
    this.editingProductPrice = 0;
    this.editingProductCategoryId = null;
  }

  addProduct(): void {
    if (!this.newProductName.trim()) {
      alert('El nombre del producto es requerido');
      return;
    }
    if (this.newProductPrice <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }
    if (!this.newProductCategoryId) {
      alert('Debe seleccionar una categoría');
      return;
    }

    const category = this.categories.find(c => c.id === this.newProductCategoryId);
    const productData = {
      name: this.newProductName,
      price: this.newProductPrice,
      description: '',
      available: true,
      categoryId: this.newProductCategoryId  // Enviar solo el ID
    };

    this.productService.createProduct(productData).subscribe({
      next: (response: any) => {
        this.products.push({
          id: response.id,
          name: this.newProductName,
          price: this.newProductPrice,
          description: '',
          available: true,
          category: category
        });
        this.resetProductForm();
        this.showAddProductForm = false;
        // Invalidar caché para que mesero vea el nuevo producto
        this.productService.invalidateCache();
      },
      error: (err: any) => {
        console.error('Error al añadir producto:', err);
        alert('Error al añadir el producto');
      }
    });
  }

  startEditProduct(product: Product): void {
    this.editingProductId = product.id || null;
    this.editingProductName = product.name;
    this.editingProductPrice = product.price;
    this.editingProductCategoryId = product.category?.id || null;
  }

  saveEditProduct(): void {
    if (!this.editingProductName.trim()) {
      alert('El nombre es requerido');
      return;
    }
    if (this.editingProductPrice <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }
    if (!this.editingProductCategoryId || this.editingProductId === null) {
      alert('Datos inválidos');
      return;
    }

    const category = this.categories.find(c => c.id === this.editingProductCategoryId);
    const productData: Product = {
      name: this.editingProductName,
      price: this.editingProductPrice,
      description: '',
      available: true,
      category: category
    };

    this.productService.updateProduct(this.editingProductId, productData).subscribe({
      next: () => {
        const product = this.products.find(p => p.id === this.editingProductId);
        if (product) {
          product.name = this.editingProductName;
          product.price = this.editingProductPrice;
          product.category = category;
        }
        this.resetProductForm();
      },
      error: (err: any) => {
        console.error('Error al actualizar:', err);
        alert('Error al actualizar el producto');
      }
    });
  }

  cancelEditProduct(): void {
    this.resetProductForm();
  }

  deleteProduct(productId: number | undefined): void {
    if (!productId) {
      alert('ID inválido');
      return;
    }
    if (!confirm('¿Confirma eliminación?')) return;

    // Actualización optimista de la UI
    const productsBackup = [...this.products];
    this.products = this.products.filter(p => p.id !== productId);

    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        // Ya actualizado - solo confirmación
        console.log('Producto eliminado exitosamente');
      },
      error: (err: any) => {
        // Restaurar en caso de error
        this.products = productsBackup;
        console.error('Error al eliminar:', err);
        alert('Error al eliminar el producto');
      }
    });
  }

  // UTILIDADES

  getCategoryName(categoryId: number | undefined): string {
    if (!categoryId) return 'Sin categoría';
    return this.categories.find(c => c.id === categoryId)?.name || 'Sin categoría';
  }

  getProductsByCategory(categoryId: number | undefined): Product[] {
    if (!categoryId) return [];
    return this.products.filter(p => p.category?.id === categoryId);
  }

  getProductCountByCategory(categoryId: number): number {
    return this.products.filter(p => p.category?.id === categoryId).length;
  }

  closeModal(): void {
    this.close.emit();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'edit' ? 'preview' : 'edit';
  }

  // SELECCIÓN MÚLTIPLE

  toggleProductSelection(productId: number | undefined): void {
    if (!productId) return;
    if (this.selectedProductIds.has(productId)) {
      this.selectedProductIds.delete(productId);
    } else {
      this.selectedProductIds.add(productId);
    }
  }

  isProductSelected(productId: number | undefined): boolean {
    return productId ? this.selectedProductIds.has(productId) : false;
  }

  selectAllProducts(): void {
    this.products.forEach(p => {
      if (p.id) this.selectedProductIds.add(p.id);
    });
  }

  deselectAllProducts(): void {
    this.selectedProductIds.clear();
  }

  deleteSelectedProducts(): void {
    const count = this.selectedProductIds.size;
    if (count === 0) {
      alert('No hay productos seleccionados');
      return;
    }
    if (!confirm(`¿Confirma eliminar ${count} producto(s)?`)) return;

    const idsToDelete = Array.from(this.selectedProductIds);
    const productsBackup = [...this.products];
    
    // Actualización optimista
    this.products = this.products.filter(p => !p.id || !this.selectedProductIds.has(p.id));
    this.selectedProductIds.clear();

    // Eliminar en backend
    let errorCount = 0;
    const deletePromises = idsToDelete.map(id => 
      this.productService.deleteProduct(id).toPromise()
        .catch((err: any) => {
          console.error(`Error eliminando producto ${id}:`, err);
          errorCount++;
        })
    );

    Promise.all(deletePromises).then(() => {
      if (errorCount > 0) {
        alert(`${errorCount} producto(s) no pudieron eliminarse. Recargando...`);
        this.products = productsBackup;
        this.loadData();
      } else {
        console.log(`${count} productos eliminados exitosamente`);
      }
    });
  }
}
