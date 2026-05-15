import { supabase } from "@/lib/supabase";

export default async function TestPage() {
  const { data } = await supabase
    .from("groups")
    .select("*");

  console.log(data);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">
        Supabase Test
      </h1>

      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
