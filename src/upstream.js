import "dotenv/config";

const upstreams = process.env.NAUTILUS_URL.split();
const upsplit = upstreams.length;
export const naut_url = (docid) => {
  let res = 0;
  for (var i = 0; i < docid.length; i++) {
    res = res * 37 + docid.charCodeAt(i);
  }
  return upstreams[res % upsplit];
};
