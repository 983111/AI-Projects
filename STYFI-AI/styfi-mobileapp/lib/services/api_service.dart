import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models.dart';

class ApiService {
  static const String baseUrl = 'https://styfi-backend.vishwajeetadkine705.workers.dev';

  // Helper to convert file to Base64
  static Future<String> fileToBase64(File file) async {
    List<int> imageBytes = await file.readAsBytes();
    return base64Encode(imageBytes);
  }

  // Helper to fetch network image to Base64 (for try-on product image)
  static Future<String?> networkImageToBase64(String imageUrl) async {
    try {
      final response = await http.get(Uri.parse(imageUrl));
      if (response.statusCode == 200) {
        return base64Encode(response.bodyBytes);
      }
      return null;
    } catch (e) {
      print("Error fetching product image: $e");
      return null;
    }
  }

  static Future<List<TrendReport>> getTrends(String category) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/trends'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'category': category}),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((e) => TrendReport.fromJson(e)).toList();
      }
    } catch (e) {
      print("Error fetching trends: $e");
    }
    // Fallback data
    return [
      TrendReport(
          trendName: "Eco-Minimalism",
          description: "Sustainable fabrics in neutral tones.",
          popularityScore: 88,
          keyKeywords: ["Linen", "Beige", "Organic"]),
      TrendReport(
          trendName: "Retro Sport",
          description: "90s athletic wear revival.",
          popularityScore: 75,
          keyKeywords: ["Neon", "Vintage"]),
    ];
  }

  static Future<List<OutfitSuggestion>> composeOutfit(String name, String category) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/compose-outfit'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'productName': name, 'productCategory': category}),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((e) => OutfitSuggestion.fromJson(e)).toList();
      }
    } catch (e) {
      print("Error composing outfit: $e");
    }
    return [
      OutfitSuggestion(
          name: "Classic Denim Jeans",
          reason: "Timeless piece.",
          estimatedPrice: "\$60-\$90",
          color: "Dark Blue"),
    ];
  }

  static Future<AiResult?> enhanceImage(File imageFile, String description) async {
    try {
      final base64Data = await fileToBase64(imageFile);
      final response = await http.post(
        Uri.parse('$baseUrl/api/enhance-image'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'imageData': base64Data,
          'mimeType': 'image/jpeg', // Assuming jpeg for simplicity
          'description': description
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['method'] == 'imagen' && data['imageData'] != null) {
          return AiResult(type: 'image', data: data['imageData']); // Base64 string
        } else if (data['method'] == 'guide' && data['enhancementGuide'] != null) {
          return AiResult(type: 'guide', data: data['enhancementGuide']);
        }
      }
    } catch (e) {
      print("Error enhancing image: $e");
    }
    return null;
  }

  static Future<AiResult?> virtualTryOn(File userImage, String productImage) async {
    try {
      final userBase64 = await fileToBase64(userImage);
      final productBase64 = await networkImageToBase64(productImage);

      if (productBase64 == null) throw Exception("Failed to load product image");

      final response = await http.post(
        Uri.parse('$baseUrl/api/virtual-tryon'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userImageData': userBase64,
          'userMimeType': 'image/jpeg',
          'productImageData': productBase64,
          'productMimeType': 'image/jpeg'
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['method'] == 'imagen' && data['imageData'] != null) {
          return AiResult(type: 'image', data: data['imageData']);
        } else if (data['method'] == 'guide' && data['visualizationGuide'] != null) {
          return AiResult(type: 'guide', data: data['visualizationGuide']);
        }
      }
    } catch (e) {
      print("Error in try-on: $e");
    }
    return null;
  }
}
