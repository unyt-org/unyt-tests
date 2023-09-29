let version = "beta";
try {
    const res = await fetch(new URL("../version", import.meta.url));
    if (res.ok) version = (await res.text()).replaceAll("\n","");
}
catch {}

export const VERSION = version