import 'package:flutter/material.dart';
import '../models.dart';
import '../services/api_service.dart';

class TrendDetectorScreen extends StatefulWidget {
  const TrendDetectorScreen({super.key});

  @override
  State<TrendDetectorScreen> createState() => _TrendDetectorScreenState();
}

class _TrendDetectorScreenState extends State<TrendDetectorScreen> {
  final TextEditingController _controller = TextEditingController();
  List<TrendReport> trends = [];
  bool isLoading = false;

  Future<void> _searchTrends() async {
    if (_controller.text.isEmpty) return;
    setState(() => isLoading = true);
    final results = await ApiService.getTrends(_controller.text);
    setState(() {
      trends = results;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: "Enter category (e.g. Summer Dresses)",
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: _searchTrends,
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(30)),
                filled: true,
                fillColor: Colors.white,
              ),
              onSubmitted: (_) => _searchTrends(),
            ),
            const SizedBox(height: 20),
            if (isLoading) const CircularProgressIndicator(),
            Expanded(
              child: ListView.builder(
                itemCount: trends.length,
                itemBuilder: (context, index) {
                  final t = trends[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(t.trendName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              Chip(
                                label: Text("Score: ${t.popularityScore}"),
                                backgroundColor: t.popularityScore > 80 ? Colors.green[100] : Colors.amber[100],
                              )
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(t.description),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            children: t.keyKeywords.map((k) => Chip(
                              label: Text("#$k", style: const TextStyle(fontSize: 12)),
                              backgroundColor: Colors.grey[100],
                            )).toList(),
                          )
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
