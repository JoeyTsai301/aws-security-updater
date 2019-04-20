
export const showS3List = (s3) => {
  return new Promise(async (resolve,reject)=>{
    var params = {};
    s3.listBuckets(params, function(err, data) {
      if (err) reject(err);
      else resolve(data);      
    });
  });
}