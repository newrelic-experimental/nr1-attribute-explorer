# Attribute Explorer

This application gives you an alternative way of exploring the performance of your services via attributes. For example, if a pricing engine has a custom attribute for product id, you can understand the response times by product id, as well as errors, hosts, url's, and any other attribute (out of the box or custom). The application displays the response times and execution counts by different attributes. You can then filter by different attributes and drill into a subset of traces matching the filters selected.

The application works for both OTEL and New Relic APM services. Spans are displayed for OTEL services, where as you can select from transactions, errors and spans for New Relic APM services. When selecting spans response times are given across all spans, not just entry spans.

To launch the application go to a service and select Attribute Explorer from the left hand menu.