import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Product = {
  id: number;
  title: string;
  category?: string;
  price?: number;
  thumbnail?: string;
  description?: string;
  brand?: string;
  rating?: number;
  stock?: number;
  discountPercentage?: number;
  weight?: number;
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  returnPolicy?: string;
  minimumOrderQuantity?: number;
  sku?: string;
  tags?: string[];
  dimensions?: { width?: number; height?: number; depth?: number };
  images?: string[];
  [key: string]: unknown;
};

const API = 'https://dummyjson.com/products';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextId, setNextId] = useState(-1);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    getProducts();
  }, []);

  // main http method used by other http protocols
  async function apiRequest(
    url: string,
    method = 'GET',
    body?: object
  ) {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async function getProducts() {
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest(`${API}?limit=0`);
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }

  async function searchProducts() {
    if (!search.trim()) {
      getProducts();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiRequest(
        `${API}/search?q=${encodeURIComponent(search.trim())}`
      );
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to search products.');
    } finally {
      setLoading(false);
    }
  }

  async function getSingleProduct(id: number) {
    setLoading(true);
    setError('');

    try {
      const product = await apiRequest(`${API}/${id}`);
      setSelectedProduct(product);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get product.');
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setTitle('');
    setPrice('');
    setCategory('');
    setError('');
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingId(product.id);
    setTitle(product.title);
    setPrice(String(product.price ?? ''));
    setCategory(product.category ?? '');
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setTitle('');
    setPrice('');
    setCategory('');
  }
  

 // The Post and Patch are both under this function
  async function saveProduct() {
    if (!title.trim() || !price.trim()) {
      setError('Enter a product name and price.');
      return;
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError('Enter a valid price.');
      return;
    }

    const body = {
      title: title.trim(),
      category: category.trim(),
      price: numericPrice,
    };

    setLoading(true);
    setError('');

    try {
      if (editingId !== null) {
        // Update the local product, including products created in this app.
        setProducts(current =>
          current.map(product =>
            product.id === editingId
              ? { ...product, ...body }
              : product
          )
        );

        // DummyJSON simulates PATCH; its database is not changed.
        try {
          await apiRequest(`${API}/${editingId}`, 'PATCH', body);
        } catch {
          // Keep the local edit even if the API does not recognize the ID.
        }
      } else {
        // Create locally with a unique ID for reliable editing and deletion.
        const localProduct: Product = {
          id: nextId,
          ...body,
          thumbnail: '',
        };

        setNextId(current => current - 1);
        setProducts(current => [localProduct, ...current]);

        // Send POST to demonstrate API creation.
        try {
          await apiRequest(`${API}/add`, 'POST', {
            ...body,
            userId: 1,
          });
        } catch {
          // The local product remains available.
        }
      }

      closeForm();
    } catch {
      setError('Could not save the product.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: number) {
    // Delete from the UI immediately.
    setProducts(current =>
      current.filter(product => product.id !== id)
    );

    if (editingId === id) {
      closeForm();
    }

    // Send DELETE to demonstrate the API request.
    try {
      await apiRequest(`${API}/${id}`, 'DELETE');
    } catch {
      // Local deletion remains effective even for locally created products.
    }
  }

  if (selectedProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailEyebrow}>PRODUCT DETAILS</Text>
          <Text style={styles.detailTitle}>{selectedProduct.title}</Text>
          <Text style={styles.detailCategory}>
            {selectedProduct.category || 'Uncategorized'}
          </Text>
        </View>

        <FlatList
          data={[selectedProduct]}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.detailList}
          renderItem={({ item }) => (
            <View>
              {item.thumbnail ? (
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.detailImage}
                  contentFit="contain"
                />
              ) : (
                <View style={styles.detailImagePlaceholder}>
                  <Text style={styles.blackText}>No image available</Text>
                </View>
              )}

              <View style={styles.detailPriceRow}>
                <Text style={styles.detailPrice}>
                  ${Number(item.price ?? 0).toFixed(2)}
                </Text>
                {typeof item.discountPercentage === 'number' && (
                  <Text style={styles.detailDiscount}>
                    {item.discountPercentage.toFixed(1)}% OFF
                  </Text>
                )}
              </View>

              <Text style={styles.detailDescription}>
                {item.description || 'No description available.'}
              </Text>

              <Text style={styles.detailSectionTitle}>PRODUCT INFORMATION</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailLabel}>Brand</Text>
                  <Text style={styles.detailValue}>{item.brand || 'N/A'}</Text>
                </View>
                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailLabel}>Rating</Text>
                  <Text style={styles.detailValue}>
                    {typeof item.rating === 'number' ? `★ ${item.rating}` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailLabel}>Stock</Text>
                  <Text style={styles.detailValue}>
                    {typeof item.stock === 'number' ? item.stock : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailLabel}>Availability</Text>
                  <Text style={styles.detailValue}>
                    {item.availabilityStatus || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailLabel}>Weight</Text>
                  <Text style={styles.detailValue}>
                    {typeof item.weight === 'number' ? `${item.weight} g` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailLabel}>Minimum Order</Text>
                  <Text style={styles.detailValue}>
                    {typeof item.minimumOrderQuantity === 'number'
                      ? item.minimumOrderQuantity
                      : 'N/A'}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailSectionTitle}>SHIPPING & RETURNS</Text>
              <View style={styles.detailInfoCard}>
                <Text style={styles.detailLabel}>Shipping</Text>
                <Text style={styles.detailValue}>
                  {item.shippingInformation || 'N/A'}
                </Text>
                <Text style={styles.detailLabel}>Warranty</Text>
                <Text style={styles.detailValue}>
                  {item.warrantyInformation || 'N/A'}
                </Text>
                <Text style={styles.detailLabel}>Return Policy</Text>
                <Text style={styles.detailValue}>
                  {item.returnPolicy || 'N/A'}
                </Text>
              </View>

              {item.dimensions && (
                <>
                  <Text style={styles.detailSectionTitle}>DIMENSIONS</Text>
                  <View style={styles.detailInfoCard}>
                    <Text style={styles.detailValue}>
                      Width: {item.dimensions.width ?? 'N/A'} · Height: {item.dimensions.height ?? 'N/A'} · Depth: {item.dimensions.depth ?? 'N/A'}
                    </Text>
                  </View>
                </>
              )}

              {item.tags && item.tags.length > 0 && (
                <>
                  <Text style={styles.detailSectionTitle}>TAGS</Text>
                  <View style={styles.detailTags}>
                    {item.tags.map(tag => (
                      <View key={tag} style={styles.detailTag}>
                        <Text style={styles.detailTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.detailSku}>SKU: {item.sku || 'N/A'}</Text>
            </View>
          )}
        />

        {/* CHANGED: floating black back button, always visible at the bottom */}
        <Pressable
          style={styles.floatingBack}
          onPress={() => setSelectedProduct(null)}
        >
          <Text style={styles.whiteText}>← BACK TO PRODUCTS</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={products}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListHeaderComponent={
            <View>
              <Text style={styles.heading}>PRODUCT STORE</Text>
              <Text style={styles.subtitle}>Product management</Text>

              <TouchableOpacity
                style={styles.blackButton}
                onPress={getProducts}
                disabled={loading}
              >
                <Text style={styles.whiteText}>GET ALL PRODUCTS</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Search products..."
                placeholderTextColor="#666"
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={searchProducts}
                returnKeyType="search"
              />

              <TouchableOpacity
                style={styles.blackButton}
                onPress={searchProducts}
                disabled={loading}
              >
                <Text style={styles.whiteText}>SEARCH PRODUCTS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.whiteButton}
                onPress={() => showForm ? closeForm() : openCreateForm()}
              >
                <Text style={styles.blackText}>
                  {showForm ? 'CANCEL' : '+ ADD PRODUCT'}
                </Text>
              </TouchableOpacity>

              {showForm && (
                <View style={styles.form}>
                  <Text style={styles.formTitle}>
                    {editingId !== null ? 'EDIT PRODUCT' : 'NEW PRODUCT'}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Product name"
                    placeholderTextColor="#666"
                    value={title}
                    onChangeText={setTitle}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Category"
                    placeholderTextColor="#666"
                    value={category}
                    onChangeText={setCategory}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Price"
                    placeholderTextColor="#666"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                  />

                  <TouchableOpacity
                    style={styles.blackButton}
                    onPress={saveProduct}
                    disabled={loading}
                  >
                    <Text style={styles.whiteText}>
                      {editingId !== null ? 'SAVE CHANGES' : 'CREATE PRODUCT'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {loading && <ActivityIndicator color="#000" />}

              {!!error && <Text style={styles.error}>{error}</Text>}

              <Text style={styles.sectionTitle}>
                PRODUCTS ({products.length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>No products found.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.thumbnail ? (
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.productImage}
                  contentFit="contain"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.blackText}>No image</Text>
                </View>
              )}

              <Text style={styles.productName}>{item.title}</Text>
              <Text style={styles.category}>
                Category: {item.category || 'N/A'}
              </Text>
              <Text style={styles.price}>
                ${Number(item.price ?? 0).toFixed(2)}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditForm(item)}
                >
                  <Text style={styles.blackText}>EDIT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => getSingleProduct(item.id)}
                  disabled={loading}
                >
                  <Text style={styles.blackText}>VIEW</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteProduct(item.id)}
                >
                  <Text style={styles.whiteText}>DELETE</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 16 },
  heading: { fontSize: 27, fontWeight: '900', color: '#000' },
  subtitle: { color: '#333', marginTop: 5, marginBottom: 20 },
  blackButton: {
    backgroundColor: '#000',
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  whiteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    padding: 13,
    alignItems: 'center',
    marginBottom: 18,
  },
  whiteText: { color: '#fff', fontWeight: 'bold' },
  blackText: { color: '#000', fontWeight: 'bold' },
  form: { borderWidth: 1, borderColor: '#000', padding: 14, marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '900', color: '#000', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 11,
    color: '#000',
    marginBottom: 10,
  },
  error: { color: '#000', padding: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 12 },
  empty: { color: '#000', textAlign: 'center', padding: 20 },
  card: { borderWidth: 1, borderColor: '#000', padding: 12 },
  productImage: { width: '100%', height: 180, marginBottom: 12 },
  imagePlaceholder: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#eee',
  },
  productName: { fontSize: 18, fontWeight: '900', color: '#000', marginBottom: 6 },
  category: { fontSize: 14, color: '#000', marginBottom: 6 },
  price: { fontSize: 17, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    padding: 12,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#000',
    padding: 12,
    alignItems: 'center',
  },
  // CHANGED: position + zIndex so nothing below can paint over the back button
  detailHeader: {
    backgroundColor: '#000',
    padding: 20,
    position: 'relative',
    zIndex: 10,
  },
  // CHANGED: floating black back button pinned to the bottom of the detail screen
  floatingBack: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 9999,
    elevation: 10,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 16,
    alignItems: 'center',
    cursor: 'pointer',
  },
  detailEyebrow: {
    color: '#bbb',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
  },
  detailCategory: {
    color: '#ddd',
    marginTop: 6,
    textTransform: 'capitalize',
  },
  detailList: {
    padding: 16,
    paddingBottom: 100,
  },
  detailImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#f5f5f5',
    marginBottom: 18,
  },
  detailImagePlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
    marginBottom: 18,
  },
  detailPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  detailPrice: {
    fontSize: 25,
    fontWeight: '900',
    color: '#000',
  },
  detailDiscount: {
    color: '#fff',
    backgroundColor: '#000',
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  detailDescription: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    marginBottom: 10,
    marginTop: 8,
    letterSpacing: 1,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  detailInfoCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  detailLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 6,
  },
  detailValue: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  detailTag: {
    borderWidth: 1,
    borderColor: '#bbb',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  detailTagText: {
    color: '#333',
    fontSize: 12,
  },
  detailSku: {
    color: '#777',
    fontSize: 12,
    marginTop: 12,
  },
});
