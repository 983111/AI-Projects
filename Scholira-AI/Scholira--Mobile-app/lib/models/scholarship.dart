class Scholarship {
  final String title;
  final String provider;
  final String amount;
  final String deadline;
  final String description;
  final String location;
  final List<String> eligibility;

  Scholarship({
    required this.title,
    required this.provider,
    required this.amount,
    required this.deadline,
    required this.description,
    required this.location,
    required this.eligibility,
  });

  factory Scholarship.fromJson(Map<String, dynamic> json) {
    return Scholarship(
      title: json['name'] ?? 'Unknown Scholarship',
      provider: json['provider'] ?? 'Unknown Provider',
      amount: json['amount'] ?? 'Not specified',
      deadline: json['deadline'] ?? 'Open',
      description: json['description'] ?? '',
      location: json['location'] ?? 'International',
      eligibility: json['eligibility'] != null 
          ? List<String>.from(json['eligibility']) 
          : [],
    );
  }
}