import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const ItemsContext = createContext(null);

const initialItems = [
  {
    id: "PL001",
    name: "Dinner Plate",
    category: "Dinnerware",
    unit: "Piece",
    purchaseCost: 2.5,
    supplier: "ABC Supplies",
    warehouse: "Alex",
    minimumStock: 100,
    available: 1250,
    outOfEvent: 200,
    damaged: 25,
    missing: 15,
    images: [],
  },
  {
    id: "GL001",
    name: "Water Glass",
    category: "Glassware",
    unit: "Piece",
    purchaseCost: 1.5,
    supplier: "Glass House",
    warehouse: "Alex",
    minimumStock: 150,
    available: 2100,
    outOfEvent: 300,
    damaged: 20,
    missing: 10,
    images: [],
  },
  {
    id: "CH001",
    name: "Chair",
    category: "Furniture",
    unit: "Piece",
    purchaseCost: 25,
    supplier: "Furniture Hub",
    warehouse: "Cairo",
    minimumStock: 50,
    available: 450,
    outOfEvent: 80,
    damaged: 10,
    missing: 15,
    images: [],
  },
  {
    id: "EQ001",
    name: "Chafing Dish",
    category: "Equipment",
    unit: "Piece",
    purchaseCost: 45,
    supplier: "Kitchen Pro",
    warehouse: "Cairo",
    minimumStock: 30,
    available: 220,
    outOfEvent: 40,
    damaged: 15,
    missing: 5,
    images: [],
  },
  {
    id: "CT001",
    name: "Cutlery Set",
    category: "Cutlery",
    unit: "Set",
    purchaseCost: 8,
    supplier: "ABC Supplies",
    warehouse: "Alex",
    minimumStock: 200,
    available: 3200,
    outOfEvent: 100,
    damaged: 5,
    missing: 2,
    images: [],
  },
  {
    id: "LN001",
    name: "Table Napkin",
    category: "Linen",
    unit: "Piece",
    purchaseCost: 1,
    supplier: "Linen House",
    warehouse: "Cairo",
    minimumStock: 300,
    available: 5000,
    outOfEvent: 104,
    damaged: 3,
    missing: 1,
    images: [],
  },
];

export function ItemsProvider({ children }) {
  const [items, setItems] = useState(initialItems);

  const addItem = (itemData) => {
    const normalizedCode = itemData.itemCode
      .trim()
      .toUpperCase();

    const codeAlreadyExists = items.some(
      (item) =>
        item.id.toLowerCase() ===
        normalizedCode.toLowerCase()
    );

    if (codeAlreadyExists) {
      return {
        success: false,
        message: "This item code already exists.",
      };
    }

    const newItem = {
      id: normalizedCode,
      name: itemData.name.trim(),
      category: itemData.category,
      unit: itemData.unit,
      purchaseCost: Number(
        itemData.purchaseCost
      ),
      supplier: itemData.supplier.trim(),
      warehouse: itemData.warehouse,
      minimumStock: Number(
        itemData.minimumStock
      ),
      available: Number(itemData.quantity),
      outOfEvent: 0,
      damaged: 0,
      missing: 0,
      images: itemData.images ?? [],
    };

    setItems((currentItems) => [
      newItem,
      ...currentItems,
    ]);

    return {
      success: true,
    };
  };

  const value = useMemo(
    () => ({
      items,
      addItem,
      setItems,
    }),
    [items]
  );

  return (
    <ItemsContext.Provider value={value}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);

  if (!context) {
    throw new Error(
      "useItems must be used inside ItemsProvider."
    );
  }

  return context;
}