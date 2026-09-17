import { Redirect } from 'expo-router';

export default function Gate() {
  // Direct redirect to beneficiary home
  return <Redirect href="/(beneficiary)" />;
}
