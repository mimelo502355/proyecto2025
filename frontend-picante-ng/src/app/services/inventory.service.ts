import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  cost: number;
  lastUpdated?: Date;
}

export interface Recipe {
  id: number;
  name: string;
  dishName: string;
  ingredients: { ingredientId: number; quantity: number }[];
}

export interface InventoryTransaction {
  id: number;
  ingredientId: number;
  quantityChange: number;
  reason: 'recipe-used' | 'manual-adjustment' | 'purchase' | 'waste';
  date: Date;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private apiUrl = 'http://localhost:8080/api/inventory';
  private http = inject(HttpClient);

  private ingredientsSubject = new BehaviorSubject<Ingredient[]>([]);
  public ingredients$ = this.ingredientsSubject.asObservable();

  private recipesSubject = new BehaviorSubject<Recipe[]>([]);
  public recipes$ = this.recipesSubject.asObservable();

  constructor() {
    this.loadMockData();
  }

  private loadMockData() {
    const mockIngredients: Ingredient[] = [
      { id: 1, name: 'Limones', unit: 'kg', stock: 25, lowStockThreshold: 5, cost: 2.5 },
      { id: 2, name: 'Pescado blanco', unit: 'kg', stock: 18, lowStockThreshold: 6, cost: 28.0 },
      { id: 3, name: 'Lechuga', unit: 'kg', stock: 30, lowStockThreshold: 8, cost: 4.0 },
      { id: 4, name: 'Cebolla roja', unit: 'kg', stock: 12, lowStockThreshold: 4, cost: 3.0 },
      { id: 5, name: 'Ají amarillo', unit: 'kg', stock: 7, lowStockThreshold: 2, cost: 8.0 },
      { id: 6, name: 'Arroz', unit: 'kg', stock: 45, lowStockThreshold: 10, cost: 3.5 },
      { id: 7, name: 'Camarones', unit: 'kg', stock: 15, lowStockThreshold: 5, cost: 35.0 },
      { id: 8, name: 'Miso', unit: 'L', stock: 5, lowStockThreshold: 1, cost: 22.0 },
      { id: 9, name: 'Caldo de pescado', unit: 'L', stock: 20, lowStockThreshold: 5, cost: 5.0 }
    ];

    const mockRecipes: Recipe[] = [
      {
        id: 1,
        name: 'Ceviche Clásico',
        dishName: 'Ceviche Clásico',
        ingredients: [
          { ingredientId: 2, quantity: 0.3 }, // 300g pescado
          { ingredientId: 1, quantity: 0.2 }, // 200ml limones
          { ingredientId: 3, quantity: 0.05 }, // 50g lechuga
          { ingredientId: 4, quantity: 0.05 }  // 50g cebolla
        ]
      },
      {
        id: 2,
        name: 'Arroz con Mariscos',
        dishName: 'Arroz con Mariscos',
        ingredients: [
          { ingredientId: 6, quantity: 0.2 }, // 200g arroz
          { ingredientId: 7, quantity: 0.2 }, // 200g camarones
          { ingredientId: 2, quantity: 0.1 }, // 100g pescado
          { ingredientId: 9, quantity: 0.4 }  // 400ml caldo
        ]
      },
      {
        id: 3,
        name: 'Ceviche Especial',
        dishName: 'Ceviche Especial',
        ingredients: [
          { ingredientId: 2, quantity: 0.35 },
          { ingredientId: 7, quantity: 0.1 },
          { ingredientId: 1, quantity: 0.25 },
          { ingredientId: 3, quantity: 0.08 },
          { ingredientId: 5, quantity: 0.03 }
        ]
      }
    ];

    this.ingredientsSubject.next(mockIngredients);
    this.recipesSubject.next(mockRecipes);
  }

  getIngredients(): Observable<Ingredient[]> {
    return this.ingredients$;
  }

  getRecipes(): Observable<Recipe[]> {
    return this.recipes$;
  }

  getIngredientById(id: number): Ingredient | undefined {
    return this.ingredientsSubject.value.find(i => i.id === id);
  }

  updateIngredientStock(ingredientId: number, newStock: number, reason: InventoryTransaction['reason'], notes?: string) {
    const ingredients = this.ingredientsSubject.value;
    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (ingredient) {
      const oldStock = ingredient.stock;
      ingredient.stock = newStock;
      ingredient.lastUpdated = new Date();
      this.ingredientsSubject.next([...ingredients]);

      // Evento en vivo: disparar toast si baja stock y propagar snapshot a websockets
      if (this.isLowStock(ingredient)) {
        // this.rt.notifyLowStock(ingredient); // DEPRECATED: No longer used with QueryClient
      }

      // Log transaction
      console.log(`Inventory change: ${ingredient.name} from ${oldStock} to ${newStock} (${reason})`);
    }
  }

  consumeIngredientByRecipe(recipeId: number): boolean {
    const recipe = this.recipesSubject.value.find(r => r.id === recipeId);
    if (!recipe) return false;

    const ingredients = this.ingredientsSubject.value;
    let canConsume = true;

    // Verificar si hay suficiente stock
    for (const item of recipe.ingredients) {
      const ingredient = ingredients.find(i => i.id === item.ingredientId);
      if (!ingredient || ingredient.stock < item.quantity) {
        canConsume = false;
        break;
      }
    }

    if (!canConsume) {
      console.warn(`No hay suficiente stock para la receta: ${recipe.name}`);
      return false;
    }

    // Descontar insumos
    for (const item of recipe.ingredients) {
      const ingredient = ingredients.find(i => i.id === item.ingredientId);
      if (ingredient) {
        const newStock = ingredient.stock - item.quantity;
        this.updateIngredientStock(item.ingredientId, newStock, 'recipe-used', `Usado en ${recipe.name}`);
      }
    }

    return true;
  }

  isLowStock(ingredient: Ingredient): boolean {
    return ingredient.stock <= ingredient.lowStockThreshold;
  }

  getToken(): string {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.accessToken || '';
    }
    return '';
  }
}
