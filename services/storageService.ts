import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc,
  query, 
  where 
} from 'firebase/firestore';
import { Client, Product, Order } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAh_EuYw2cFLb_fdkvbgj6UkbwnazgPtbY",
  authDomain: "antoniovendas-5e671.firebaseapp.com",
  projectId: "antoniovendas-5e671",
  storageBucket: "antoniovendas-5e671.firebasestorage.app",
  messagingSenderId: "759032572842",
  appId: "1:759032572842:web:f876b6d767f9b5b15f19d3",
  measurementId: "G-TZ81FQ4EPH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Helpers ---
// In Firebase, we usually let Firestore generate IDs for new docs (addDoc), 
// or we use setDoc with a custom ID.

// --- Clients ---
export const getClients = async (): Promise<Client[]> => {
  const querySnapshot = await getDocs(collection(db, 'clients'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
};

export const saveClient = async (client: Omit<Client, 'id' | 'createdAt'> & { id?: string }): Promise<Client> => {
  const collectionRef = collection(db, 'clients');
  
  if (client.id) {
    // Update existing
    const docRef = doc(db, 'clients', client.id);
    const updatedClient = { ...client }; 
    // Ensure we don't overwrite createdAt if we don't have it in the object, 
    // but usually we just merge. Firestore setDoc with {merge: true} is an option,
    // but here we are passing the full object.
    // Let's grab the existing createdAt if possible or just not worry for now as we pass full objects.
    // For simplicity in this migration, we update the whole doc.
    await setDoc(docRef, updatedClient, { merge: true });
    return { id: client.id, ...updatedClient } as Client;
  } else {
    // Create new
    const newClientData = {
      ...client,
      createdAt: Date.now(),
    };
    const docRef = await addDoc(collectionRef, newClientData);
    return { id: docRef.id, ...newClientData } as Client;
  }
};

// --- Products ---
export const getProducts = async (): Promise<Product[]> => {
  const querySnapshot = await getDocs(collection(db, 'products'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const deleteProduct = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'products', id));
};

export const saveProduct = async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
  const collectionRef = collection(db, 'products');

  if (product.id) {
    // Update specific ID
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, product, { merge: true });
    return { ...product } as Product;
  }

  // Check for duplicates by reference if creating new
  const q = query(collectionRef, where("reference", "==", product.reference));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // Update the first matching product
    const existingDoc = querySnapshot.docs[0];
    const docRef = doc(db, 'products', existingDoc.id);
    await setDoc(docRef, product, { merge: true });
    return { id: existingDoc.id, ...product } as Product;
  }

  // Create New
  const docRef = await addDoc(collectionRef, product);
  return { id: docRef.id, ...product } as Product;
};

// Seed initial products
export const seedInitialProducts = async () => {
  // Check if we have products
  const currentProducts = await getProducts();
  if (currentProducts.length > 0) return; // Already seeded

  const initials: Omit<Product, 'id'>[] = [
    // Linha Segurança VIPFLEX
    { reference: '323', price: 78.00, description: 'BOTINA AGROLEV ELASTICO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'PALHA', sole: 'VIPFLEX FOLHA AMARELO', material: 'LATEGO PALHA' },
    { reference: '327', price: 81.80, description: 'BOTINA AGROLEV ELASTICO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'MILHO', sole: 'VIPFLEX FOLHA AMARELO', material: 'NOBUCK MILHO' },
    { reference: '328', price: 81.80, description: 'BOTINA AGROLEV ELASTICO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'CAFÉ', sole: 'VIPFLEX FOLHA GRAFITE', material: 'NOBUCK CAFÉ' },
    { reference: '329', price: 81.80, description: 'BOTINA AGROLEV ELASTICO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'PRETO', sole: 'VIPFLEX FOLHA GRAFITE', material: 'NOBUCK PRETO' },
    { reference: '330', price: 95.90, description: 'COTURNO AGROLEV CADARÇO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'CAFÉ', sole: 'VIPFLEX FOLHA GRAFITE', material: 'NOBUCK CAFÉ' },
    { reference: '331', price: 89.90, description: 'COTURNO AGROLEV CADARÇO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'CHOCOLATE', sole: 'VIPFLEX FOLHA GRAFITE', material: 'LATEGO CHOCOLATE' },
    { reference: '332', price: 89.90, description: 'COTURNO AGROLEV CADARÇO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'PALHA', sole: 'VIPFLEX FOLHA GRAFITE', material: 'LATEGO PALHA' },
    { reference: '350', price: 99.90, description: 'COTURNO AGROLEV VELCRO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'CAFÉ', sole: 'VIPFLEX FOLHA GRAFITE', material: 'NOBUCK CAFÉ' },
    { reference: '354', price: 96.50, description: 'COTURNO AGROLEV VELCRO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'CHOCOLATE', sole: 'VIPFLEX FOLHA GRAFITE', material: 'LATEGO CHOCOLATE' },
    { reference: '360', price: 83.00, description: 'BOTINA ELETRICISTA', category: 'Segurança VIPFLEX', grid: '33-46', color: 'CARAMELO', sole: 'VIPFLEX FOLHA AMARELO', material: 'FLOTER CARA. HIDROF.' },
    { reference: '2103', price: 81.00, description: 'BOTINA SEG. VIPFLEX C/ ELASTICO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'PRETA', sole: 'VIPFLEX PRETO/CAFÉ', material: 'VAQUETA PRETA' },
    { reference: '2123', price: 81.00, description: 'BOTINA SEG. VIPFLEX C/ ELASTICO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'PALHA', sole: 'VIPFLEX PRETO/CARAMELO', material: 'LATEGO PALHA' },
    { reference: '2124', price: 81.00, description: 'BOTINA SEG. VIPFLEX C/ ELASTICO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'CHOCOLATE', sole: 'VIPFLEX PRETO/CAFÉ', material: 'LATEGO CHOCOLATE' },
    { reference: '2127', price: 86.00, description: 'BOTINA SEG. VIPFLEX C/ ELASTICO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'MILHO', sole: 'VIPFLEX PRETO/CARAMELO', material: 'NOBUCK MILHO' },
    { reference: '2153', price: 98.00, description: 'COTURNO SEG. VIPFLEX ACOLCH. C/ VELCRO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'PRETA', sole: 'VIPFLEX PRETO/CAFÉ', material: 'VAQUETA PRETA' },
    { reference: '2154', price: 98.00, description: 'COTURNO SEG. VIPFLEX ACOLCH. C/ VELCRO', category: 'Segurança VIPFLEX', grid: '33-46', color: 'CHOCOLATE', sole: 'VIPFLEX PRETO/CAFÉ', material: 'LATEGO CHOCOLATE' },
    { reference: '2170', price: 108.80, description: 'COTURNO COMFORT VIPFLEX ACOLCH. C/ CADAR', category: 'Segurança VIPFLEX', grid: '33-46', color: 'MILHO', sole: 'VIPFLEX PRETO/CARAMELO', material: 'NOBUCK MILHO' },

    // Linha Segurança BORRACHA
    { reference: '4001', price: 53.90, description: 'BOTINA SEG./PNEU', category: 'Segurança BORRACHA', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'RASPA PRETA' },
    { reference: '4002', price: 53.90, description: 'BOTINA SEG./PNEU', category: 'Segurança BORRACHA', grid: '33-46', color: 'AMARELA', sole: 'BORRACHA PRETO', material: 'RASPA AMARELA' },
    { reference: '5001', price: 59.90, description: 'BOTINA SEG. ELASTICO COBERTO CANO BAIXO', category: 'Segurança BORRACHA', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'RASPA LISA PRETA' },
    { reference: '5003', price: 63.60, description: 'BOTINA SEG. ELASTICO COBERTO CANO BAIXO', category: 'Segurança BORRACHA', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'VAQUETA PRETA' },
    { reference: '5023', price: 63.60, description: 'BOTINA SEG. ELASTICO COBERTO CANO BAIXO', category: 'Segurança BORRACHA', grid: '33-46', color: 'PALHA', sole: 'BORRACHA PRETO', material: 'LATEGO PALHA' },
    { reference: '1001', price: 66.50, description: 'BOTINA SEG. ELASTICO COBERTO', category: 'Segurança BORRACHA', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'RASPA PRETA' },
    { reference: '1003', price: 69.90, description: 'BOTINA SEG. ELASTICO COBERTO', category: 'Segurança BORRACHA', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'VAQUETA PRETA' },
    { reference: '1010', price: 69.90, description: 'BOTINA SEG. ELASTICO COBERTO', category: 'Segurança BORRACHA', grid: '33-46', color: 'FÓSSIL', sole: 'BORRACHA PRETO', material: 'LATEGO FÓSSIL' },
    { reference: '1023', price: 69.90, description: 'BOTINA SEG. ELASTICO COBERTO', category: 'Segurança BORRACHA', grid: '33-46', color: 'PALHA', sole: 'BORRACHA PRETO', material: 'LATEGO PALHA' },
    { reference: '1024', price: 69.90, description: 'BOTINA SEG. ELASTICO COBERTO', category: 'Segurança BORRACHA', grid: '33-46', color: 'CHOCOLATE', sole: 'BORRACHA PRETO', material: 'LATEGO CHOCOLATE' },
    { reference: '26', price: 84.80, description: 'BOTINA AGRO SEG. ELASTICO COBERTO', category: 'Segurança BORRACHA', grid: '33-46', color: 'RATO', sole: 'BORRACHA BICOLOR DELTA', material: 'NOBUCK RATO' },
    { reference: '27', price: 84.80, description: 'BOTINA AGRO SEG. ELASTICO COBERTO', category: 'Segurança BORRACHA', grid: '33-46', color: 'MILHO', sole: 'BORRACHA BICOLOR SENNA', material: 'NOBUCK MILHO' },
    { reference: '28', price: 84.80, description: 'BOTINA AGRO SEG. ELASTICO COBERTO', category: 'Segurança BORRACHA', grid: '33-46', color: 'CAFÉ', sole: 'BORRACHA BICOLOR SENNA', material: 'NOBUCK CAFÉ' },
    { reference: '29', price: 84.80, description: 'BOTINA AGRO SEG. ELASTICO COBERTO', category: 'Segurança BORRACHA', grid: '33-46', color: 'PRETO', sole: 'BORRACHA BICOLOR SENNA', material: 'NOBUCK PRETO' },
    { reference: '3130', price: 89.90, description: 'COTURNO CADARÇO ADV', category: 'Segurança BORRACHA', grid: '33-46', color: 'CAFÉ', sole: 'SOLADO TREKKING', material: 'NOBUCK CAFÉ' },
    { reference: '3135', price: 89.90, description: 'COTURNO CADARÇO ADV', category: 'Segurança BORRACHA', grid: '33-46', color: 'PRETO', sole: 'SOLADO TREKKING', material: 'NOBUCK PRETO' },
    { reference: '200', price: 99.90, description: 'BOTTENIS SEGURANCA', category: 'Segurança BORRACHA', grid: '33-46', color: 'RATO', sole: 'BORRACHA BICOLOR', material: 'NOBUCK RATO' },
    { reference: '4055', price: 117.00, description: 'COTURNO TIPO MILITAR CADARÇO C/ ZIPER', category: 'Segurança BORRACHA', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'VAQUETA PRETA' },

    // Linha Segurança P.U – BIDENSIDADE
    { reference: '1101', price: 81.90, description: 'BOTINA SEG. ELASTICO COBERTO', category: 'Segurança P.U', grid: '33-46', color: 'PRETA', sole: 'PU BID. PRETO/GRAFITE', material: 'RASPA PRETA' },
    { reference: '1103', price: 86.50, description: 'BOTINA SEG. ELASTICO COBERTO', category: 'Segurança P.U', grid: '33-46', color: 'PRETA', sole: 'PU BID. PRETO/GRAFITE', material: 'VAQUETA PRETA' },
    { reference: '1110', price: 86.50, description: 'BOTINA SEG. ELASTICO COBERTO', category: 'Segurança P.U', grid: '33-46', color: 'FÓSSIL', sole: 'PU BID. PRETO/GRAFITE', material: 'LATEGO FÓSSIL' },
    { reference: '1123', price: 86.50, description: 'BOTINA SEG. ELASTICO COBERTO', category: 'Segurança P.U', grid: '33-46', color: 'PALHA', sole: 'PU BID. PRETO/GRAFITE', material: 'LATEGO PALHA' },
    { reference: '1124', price: 86.50, description: 'BOTINA SEG. ELASTICO COBERTO', category: 'Segurança P.U', grid: '33-46', color: 'CHOCOLATE', sole: 'PU BID. PRETO/GRAFITE', material: 'LATEGO CHOCOLATE' },
    { reference: '1104', price: 96.90, description: 'COTURNO SEG. ACOLCH. C/ CADARÇO', category: 'Segurança P.U', grid: '33-46', color: 'PRETA', sole: 'PU BID. PRETO/GRAFITE', material: 'VAQUETA PRETA' },
    { reference: '1126', price: 96.90, description: 'COTURNO SEG. ACOLCH. C/ CADARÇO', category: 'Segurança P.U', grid: '33-46', color: 'PALHA', sole: 'PU BID. PRETO/GRAFITE', material: 'LATEGO PALHA' },
    { reference: '1128', price: 96.90, description: 'COTURNO SEG. ACOLCH. C/ CADARÇO', category: 'Segurança P.U', grid: '33-46', color: 'CHOCOLATE', sole: 'PU BID. PRETO/GRAFITE', material: 'LATEGO CHOCOLATE' },
    { reference: '1180', price: 95.00, description: 'BOTINA SEG. ELASTICO COB. COMPOSITE', category: 'Segurança P.U', grid: '33-46', color: 'PRETA', sole: 'PU BID. PRETO/GRAFITE', material: 'VAQUETA PRETA' },
    { reference: '1130', price: 99.90, description: 'COTURNO SEG. ACOLCH. C/ CADARÇO', category: 'Segurança P.U', grid: '33-46', color: 'CAFÉ', sole: 'PU BID. PRETO/GRAFITE', material: 'NOBUCK CAFÉ' },
    { reference: '1185', price: 106.60, description: 'COTURNO SEG. ACOLCH. C/ CADARÇO', category: 'Segurança P.U', grid: '33-46', color: 'PRETA', sole: 'PU BID. PRETO/GRAFITE', material: 'VAQUETA PRETA' },
    { reference: '1153', price: 105.50, description: 'COTURNO SEG. ACOLCH. C/ VELCRO', category: 'Segurança P.U', grid: '33-46', color: 'PRETA', sole: 'PU BID. PRETO/GRAFITE', material: 'VAQUETA PRETA' },
    { reference: '1154', price: 105.50, description: 'COTURNO SEG. ACOLCH. C/ VELCRO', category: 'Segurança P.U', grid: '33-46', color: 'CHOCOLATE', sole: 'PU BID. PRETO/GRAFITE', material: 'LATEGO CHOCOLATE' },
    { reference: '1150', price: 110.90, description: 'COTURNO SEG. ACOLCH. C/ VELCRO', category: 'Segurança P.U', grid: '33-46', color: 'CAFÉ', sole: 'PU BID. PRETO/GRAFITE', material: 'NOBUCK CAFÉ' },
    { reference: '1155', price: 110.90, description: 'COTURNO SEG. ACOLCH. C/ VELCRO', category: 'Segurança P.U', grid: '33-46', color: 'PRETO', sole: 'PU BID. PRETO/GRAFITE', material: 'NOBUCK PRETO' },

    // Linha Infantil
    { reference: '76', price: 50.80, description: 'BOTINA INFANTIL TRADICIONAL. 2 PIQ', category: 'Infantil', grid: '33-46', color: 'PALHA', sole: 'BORRACHA PRETO', material: 'LATEGO PALHA' },
    { reference: '78', price: 56.50, description: 'BOTINA INFANTIL TRADICIONAL. 2 PIQ', category: 'Infantil', grid: '33-46', color: 'CAFÉ', sole: 'PVC NATURAL', material: 'NOBUCK CAFÉ' },
    { reference: '79', price: 56.50, description: 'BOTINA INFANTIL TRADICIONAL. 2 PIQ', category: 'Infantil', grid: '33-46', color: 'MILHO', sole: 'PVC NATURAL', material: 'NOBUCK MILHO' },

    // Linha Passeio
    { reference: '9', price: 105.90, description: 'BOTINA ELASTICO COBERTO', category: 'Passeio', grid: '33-46', color: 'PALHA', sole: 'LATEX NATURAL', material: 'LATEGO PALHA' },
    { reference: '10', price: 91.00, description: 'BOTINA ELASTICO COBERTO', category: 'Passeio', grid: '33-46', color: 'CAFÉ', sole: 'BORRACHA CAFÉ', material: 'NOBUCK CAFÉ' },
    { reference: '17', price: 99.90, description: 'BOTINA TRADICIONAL 2PIQ BORDADO', category: 'Passeio', grid: '33-46', color: 'CAFÉ', sole: 'LATEX NATURAL', material: 'NOBUCK CAFÉ' },
    { reference: '35', price: 105.00, description: 'BOTINA ACOLCH. ZIPER', category: 'Passeio', grid: '33-46', color: 'CAFÉ', sole: 'BORRACHA CAFÉ', material: 'NOBUCK CAFÉ' },
    { reference: '36', price: 117.80, description: 'BOTINA ACOLCH. ZIPER', category: 'Passeio', grid: '33-46', color: 'PALHA', sole: 'LATEX NATURAL', material: 'LATEGO PALHA' },
    { reference: '38', price: 109.90, description: 'BOTINA ACOLCH. ZIPER', category: 'Passeio', grid: '33-46', color: 'PRETA', sole: 'LATEX PRETO', material: 'VAQUETA PRETA' },
    { reference: '81', price: 94.40, description: 'BOTINA CHELSEA FLOTER BR', category: 'Passeio', grid: '33-46', color: 'CHOCOLATE', sole: 'BORRACHA SELEIRO', material: 'FLOTER CHOCOLATE' },
    { reference: '82', price: 94.40, description: 'BOTINA CHELSEA FLOTER BR', category: 'Passeio', grid: '33-46', color: 'PRETA', sole: 'BORRACHA SELEIRO', material: 'FLOTER PRETA' },
    { reference: '83', price: 94.40, description: 'BOTINA CHELSEA FLOTER BR', category: 'Passeio', grid: '33-46', color: 'FÓSSIL', sole: 'BORRACHA SELEIRO', material: 'FLOTER FOSSIL' },
    { reference: '180', price: 92.90, description: 'BOTINA VAQUEIRO B. REDONDO', category: 'Passeio', grid: '33-46', color: 'PALHA', sole: 'LATEX NATURAL', material: 'LATEGO PALHA' },

    // Linha Serviço
    { reference: '500', price: 53.90, description: 'BOTINA SERVIÇO', category: 'Serviço', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'RASPA LISA PRETO' },
    { reference: '403', price: 56.50, description: 'BOTINA SERVIÇO COM COSTURA LATERAL', category: 'Serviço', grid: '33-46', color: 'PALHA', sole: 'SOLADO BOIADEIRO', material: 'LATEGO PALHA' },
    { reference: '503', price: 56.50, description: 'BOTINA SERVIÇO', category: 'Serviço', grid: '33-46', color: 'PALHA', sole: 'BORRACHA PRETO', material: 'LATEGO PALHA' },
    { reference: '504', price: 56.50, description: 'BOTINA SERVIÇO', category: 'Serviço', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'VAQUETA PRETA' },
    { reference: '506', price: 56.50, description: 'BOTINA SERVIÇO', category: 'Serviço', grid: '33-46', color: 'CHOCOLATE', sole: 'BORRACHA PRETO', material: 'LATEGO CHOCOLATE' },
    { reference: '510', price: 56.50, description: 'BOTINA SERVIÇO', category: 'Serviço', grid: '33-46', color: 'FÓSSIL', sole: 'BORRACHA PRETO', material: 'LATEGO FÓSSIL' },
    { reference: '502', price: 58.60, description: 'BOTINA COLHEDOR DE CAFÉ', category: 'Serviço', grid: '33-46', color: 'PALHA', sole: 'CHUTEIRA PRETO', material: 'LATEGO PALHA' },
    { reference: '505', price: 61.60, description: 'BOTINA SERVIÇO', category: 'Serviço', grid: '33-46', color: 'PALHA', sole: 'PVC NATURAL', material: 'LATEGO PALHA' },
    { reference: '507', price: 65.90, description: 'BOTINA SERVIÇO', category: 'Serviço', grid: '33-46', color: 'CAFÉ', sole: 'PVC NATURAL', material: 'NOBUCK CAFÉ' },
    { reference: '606', price: 69.90, description: 'BOTINA 2 PIQ C/ TIRA', category: 'Serviço', grid: '33-46', color: 'PALHA', sole: 'BORRACHA PRETO', material: 'LATEGO PALHA' },
    { reference: '605', price: 73.80, description: 'BOTINA 2 PIQ C/ TIRA', category: 'Serviço', grid: '33-46', color: 'PALHA', sole: 'PVC NATURAL', material: 'LATEGO PALHA' },

    // Linha Sapato
    { reference: '3002', price: 58.90, description: 'SAPATO SEG. ACOLCH. CADARÇO', category: 'Sapato', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'VAQUETA PRETA' },
    { reference: '3006', price: 58.90, description: 'SAPATO SEG. ACOLCH. ELASTICO', category: 'Sapato', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'VAQUETA PRETA' },
    { reference: '3020', price: 65.50, description: 'SAPATO SOCIAL CADARÇO BICO QUADRADO', category: 'Sapato', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'VAQUETA PRETA' },
    { reference: '3000', price: 74.00, description: 'SAPATO SOCIAL CADARÇO BICO REDONDO', category: 'Sapato', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'VAQUETA PRETA' },
    { reference: '3030', price: 74.00, description: 'SAPATO SOCIAL CADARÇO BICO QUADRADO', category: 'Sapato', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'VAQUETA PRETA' },
    { reference: '3220', price: 72.30, description: 'SAPATO FEMININO ELASTICO', category: 'Sapato', grid: '33-46', color: 'PRETA', sole: 'PVC PRETO', material: 'VAQUETA PRETA' },
    { reference: '3040', price: 82.80, description: 'SAPATO SOCIAL ELÁSTICO BICO QUADRADO', category: 'Sapato', grid: '33-46', color: 'PRETA', sole: 'BORRACHA PRETO', material: 'VAQUETA PRETA' },
    { reference: '3102', price: 79.90, description: 'SAPATO SEG. ACOLCH. ELASTICO', category: 'Sapato', grid: '33-46', color: 'PRETA', sole: 'PU BID. PRETO/GRAFITE', material: 'RELAX PRETA' },
    { reference: '3101', price: 86.00, description: 'SAPATO SEG. ACOLCH. ELASTICO', category: 'Sapato', grid: '33-46', color: 'PRETA', sole: 'PU BID. PRETO/GRAFITE', material: 'VAQUETA PRETA' },
  ];

  // Batch add would be better but simple loop works for seeding
  const collectionRef = collection(db, 'products');
  for (const item of initials) {
    await addDoc(collectionRef, item);
  }
};

// --- Orders ---
export const getOrders = async (): Promise<Order[]> => {
  const querySnapshot = await getDocs(collection(db, 'orders'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const saveOrder = async (order: Omit<Order, 'id' | 'date'>): Promise<Order> => {
  const newOrderData = {
    ...order,
    date: Date.now(),
  };
  const docRef = await addDoc(collection(db, 'orders'), newOrderData);
  return { id: docRef.id, ...newOrderData } as Order;
};

export const getOrdersByClient = async (clientId: string): Promise<Order[]> => {
  const q = query(collection(db, 'orders'), where("clientId", "==", clientId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};
