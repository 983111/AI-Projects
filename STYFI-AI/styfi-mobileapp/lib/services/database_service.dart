<<<<<<< HEAD
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
=======
import 'package:cloud_firestore/cloud_firestore.dart';
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
import '../models.dart';

class DatabaseService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
<<<<<<< HEAD
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // --- Products ---
  Stream<List<Product>> getProducts() {
    return _db.collection('products')
        .orderBy('createdAt', descending: true)
        .snapshots().map((snapshot) {
=======

  // Get all products (For Marketplace)
  Stream<List<Product>> getProducts() {
    return _db.collection('products').snapshots().map((snapshot) {
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
      return snapshot.docs.map((doc) => Product.fromMap(doc.data(), doc.id)).toList();
    });
  }

<<<<<<< HEAD
=======
  // Get products for a specific seller (For Seller Dashboard)
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
  Stream<List<Product>> getSellerProducts(String sellerId) {
    return _db.collection('products')
        .where('sellerId', isEqualTo: sellerId)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => Product.fromMap(doc.data(), doc.id)).toList();
    });
  }

<<<<<<< HEAD
  // --- Image Upload Function (Required for Seller) ---
  Future<String> uploadProductImage(File imageFile, String uid) async {
    try {
      String fileName = '${DateTime.now().millisecondsSinceEpoch}.jpg';
      Reference ref = _storage.ref().child('products/$uid/$fileName');
      
      UploadTask uploadTask = ref.putFile(imageFile);
      TaskSnapshot snapshot = await uploadTask;
      
      return await snapshot.ref.getDownloadURL();
    } catch (e) {
      print("Upload Error: $e");
      throw Exception("Image upload failed: $e");
    }
  }

  Future<void> addProduct(Product product) async {
    await _db.collection('products').add(product.toMap());
  }

  Future<void> deleteProduct(String productId) async {
    await _db.collection('products').doc(productId).delete();
  }

  // --- Orders Logic (Required for Checkout) ---
  Future<void> placeFullOrder(String buyerId, Product product, Address address, String paymentMethod) async {
    final order = OrderModel(
      id: '',
      buyerId: buyerId,
      sellerId: product.sellerId,
      product: product,
      address: address,
      paymentMethod: paymentMethod,
      status: 'Processing',
      date: DateTime.now(),
    );
    await _db.collection('orders').add(order.toMap());
  }

  Stream<List<OrderModel>> getSellerOrders(String sellerId) {
    return _db.collection('orders')
        .where('sellerId', isEqualTo: sellerId)
        .orderBy('date', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => OrderModel.fromMap(doc.data(), doc.id)).toList();
    });
  }

  Future<void> updateOrderStatus(String orderId, String newStatus) async {
    await _db.collection('orders').doc(orderId).update({'status': newStatus});
  }
}
=======
  // Add a product
  Future<void> addProduct(Product product) async {
    await _db.collection('products').add(product.toMap());
  }
}
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
