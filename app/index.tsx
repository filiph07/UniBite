import { Redirect } from 'expo-router';

export default function Index() {
  // Entry point: always start in the auth flow.
  return <Redirect href="/(auth)" />;
}

