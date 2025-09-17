import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/user_service.dart';
import '../../services/analytics_service.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({Key? key}) : super(key: key);

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  String _selectedPeriod = 'Last 7 days';
  final List<String> _periods = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'All time'];

  @override
  void initState() {
    super.initState();
    // Load analytics data
    context.read<AnalyticsService>().loadAnalytics();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
        elevation: 0,
        actions: [
          PopupMenuButton<String>(
            value: _selectedPeriod,
            onSelected: (String period) {
              setState(() => _selectedPeriod = period);
              // TODO: Filter data by period
            },
            itemBuilder: (BuildContext context) {
              return _periods.map<PopupMenuEntry<String>>((String value) {
                return PopupMenuItem<String>(
                  value: value,
                  child: Text(value),
                );
              }).toList();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_selectedPeriod),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_drop_down),
                ],
              ),
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Consumer2<UserService, AnalyticsService>(
        builder: (context, userService, analyticsService, child) {
          if (analyticsService.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Overview Cards
                _buildOverviewSection(context, userService, analyticsService),
                const SizedBox(height: 24),
                
                // Profile Views Chart
                _buildChartSection(
                  context,
                  'Profile Views',
                  analyticsService.profileViewsData,
                  Colors.blue,
                ),
                const SizedBox(height: 24),
                
                // QR Code Scans Chart
                _buildChartSection(
                  context,
                  'QR Code Scans',
                  analyticsService.qrScansData,
                  Colors.green,
                ),
                const SizedBox(height: 24),
                
                // Link Clicks
                _buildLinkClicksSection(context, analyticsService),
                const SizedBox(height: 24),
                
                // Visitor Demographics
                _buildDemographicsSection(context, analyticsService),
                const SizedBox(height: 24),
                
                // Top Referrers
                _buildReferrersSection(context, analyticsService),
                const SizedBox(height: 24),
                
                // Recent Activity
                _buildRecentActivitySection(context, analyticsService),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildOverviewSection(
    BuildContext context,
    UserService userService,
    AnalyticsService analyticsService,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Overview',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          children: [
            _buildOverviewCard(
              'Total Views',
              '${userService.profileViews}',
              Icons.visibility,
              Colors.blue,
              '+${analyticsService.viewsGrowth}%',
            ),
            _buildOverviewCard(
              'QR Scans',
              '${userService.qrScans}',
              Icons.qr_code_scanner,
              Colors.green,
              '+${analyticsService.scansGrowth}%',
            ),
            _buildOverviewCard(
              'Link Clicks',
              '${userService.linkClicks}',
              Icons.mouse,
              Colors.orange,
              '+${analyticsService.clicksGrowth}%',
            ),
            _buildOverviewCard(
              'Unique Visitors',
              '${analyticsService.uniqueVisitors}',
              Icons.person,
              Colors.purple,
              '+${analyticsService.visitorsGrowth}%',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildOverviewCard(
    String title,
    String value,
    IconData icon,
    Color color,
    String growth,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 24),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    growth,
                    style: TextStyle(
                      color: Colors.green.shade700,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChartSection(
    BuildContext context,
    String title,
    List<Map<String, dynamic>> data,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: data.isEmpty
                  ? Center(
                      child: Text(
                        'No data available',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                    )
                  : _buildSimpleChart(data, color),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSimpleChart(List<Map<String, dynamic>> data, Color color) {
    // Simple bar chart implementation
    final maxValue = data.fold<double>(
      0,
      (prev, item) => (item['value'] as num).toDouble() > prev
          ? (item['value'] as num).toDouble()
          : prev,
    );

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: data.map<Widget>((item) {
        final height = maxValue > 0 ? (item['value'] / maxValue) * 150 : 0;
        return Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Text(
              '${item['value']}',
              style: const TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 4),
            Container(
              width: 30,
              height: height.toDouble(),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              item['label'],
              style: const TextStyle(fontSize: 10),
              textAlign: TextAlign.center,
            ),
          ],
        );
      }).toList(),
    );
  }

  Widget _buildLinkClicksSection(BuildContext context, AnalyticsService analyticsService) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Link Clicks',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...analyticsService.linkClicks.map(
              (link) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    Icon(
                      _getLinkIcon(link['platform']),
                      size: 20,
                      color: _getLinkColor(link['platform']),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            link['platform'],
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                          Text(
                            link['url'],
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${link['clicks']}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDemographicsSection(BuildContext context, AnalyticsService analyticsService) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Visitor Demographics',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Top Countries',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ...analyticsService.topCountries.map(
                        (country) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Text(country['flag']),
                              const SizedBox(width: 8),
                              Expanded(child: Text(country['name'])),
                              Text('${country['percentage']}%'),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Devices',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ...analyticsService.deviceTypes.map(
                        (device) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Icon(
                                device['icon'],
                                size: 16,
                                color: Colors.grey.shade600,
                              ),
                              const SizedBox(width: 8),
                              Expanded(child: Text(device['name'])),
                              Text('${device['percentage']}%'),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReferrersSection(BuildContext context, AnalyticsService analyticsService) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Top Referrers',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...analyticsService.topReferrers.map(
              (referrer) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 12,
                      backgroundColor: Colors.grey.shade200,
                      child: Icon(
                        referrer['icon'],
                        size: 16,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(referrer['source']),
                    ),
                    Text('${referrer['visits']} visits'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentActivitySection(BuildContext context, AnalyticsService analyticsService) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Recent Activity',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...analyticsService.recentActivity.map(
              (activity) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: _getActivityColor(activity['type']).withOpacity(0.2),
                      child: Icon(
                        _getActivityIcon(activity['type']),
                        size: 16,
                        color: _getActivityColor(activity['type']),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(activity['description']),
                          Text(
                            DateFormat('MMM d, h:mm a').format(activity['timestamp']),
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getLinkIcon(String platform) {
    switch (platform.toLowerCase()) {
      case 'facebook': return Icons.facebook;
      case 'instagram': return Icons.camera_alt;
      case 'twitter': return Icons.alternate_email;
      case 'linkedin': return Icons.business;
      case 'youtube': return Icons.play_arrow;
      default: return Icons.link;
    }
  }

  Color _getLinkColor(String platform) {
    switch (platform.toLowerCase()) {
      case 'facebook': return Colors.blue.shade700;
      case 'instagram': return Colors.purple.shade400;
      case 'twitter': return Colors.blue.shade400;
      case 'linkedin': return Colors.blue.shade800;
      case 'youtube': return Colors.red.shade600;
      default: return Colors.grey.shade600;
    }
  }

  IconData _getActivityIcon(String type) {
    switch (type) {
      case 'profile_view': return Icons.visibility;
      case 'qr_scan': return Icons.qr_code_scanner;
      case 'link_click': return Icons.mouse;
      default: return Icons.activity;
    }
  }

  Color _getActivityColor(String type) {
    switch (type) {
      case 'profile_view': return Colors.blue;
      case 'qr_scan': return Colors.green;
      case 'link_click': return Colors.orange;
      default: return Colors.grey;
    }
  }
}