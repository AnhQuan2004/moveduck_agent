type Tweet = {
    text: string;
    authorFullname: string;
    authorUsername: string;
    authorImg: string;
    createdAt: string;
    url: string;
  };
  async function getFile(cid: string): Promise<Tweet[]> {
    try {
        console.log(`Fetching file: ${cid}`);
        const response = await fetch(`https://blush-hollow-damselfly-687.mypinata.cloud/ipfs/${cid}`);
        
        if (!response.ok) {
            console.log(`HTTP error ${response.status} for CID: ${cid}`);
            return [];
        }
        
        const text = await response.text();
        
        // Log first 100 characters of raw content for debugging
        console.log(`Raw content preview for ${cid}: ${text.substring(0, 100)}...`);
        
        try {
            const json = JSON.parse(text);
            
            // Kiểm tra xem json có phải array không
            if (!Array.isArray(json)) {
                console.log(`Content for ${cid} is not an array`);
                return [];
            }
            
            // Filter và validate từng item trong array
            const validTweets = json.filter(item => {
                const isValid = item && 
                    typeof item === 'object' &&
                    typeof item.text === 'string' &&
                    typeof item.authorFullname === 'string' &&
                    typeof item.authorUsername === 'string';
                
                if (!isValid) {
                    console.log(`Invalid tweet format in ${cid}:`, JSON.stringify(item).substring(0, 100));
                }
                
                return isValid;
            });
  
            console.log(`Found ${validTweets.length} valid tweets in ${cid}`);
            return validTweets;
  
        } catch (parseError) {
            // Log chi tiết về lỗi parse
            console.log(`Parse error for ${cid}:`, {
                error: parseError.message,
                preview: text.substring(0, 100),
                type: typeof text
            });
            return [];
        }
    } catch (error) {
        console.log(`Network/fetch error for ${cid}:`, error.message);
        return [];
    }
  }

  async function writeToLog(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        // await fs.appendFile('pinata_log.txt', logMessage);
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
  }

  export async function getAllData() {
      const url = 'https://api.pinata.cloud/v3/files/public';
      const options = {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkZDkyNDM1OC0zNjQzLTRhOWMtYjJmOS1lMDIyMjNlYzcwZWUiLCJlbWFpbCI6ImZseWZpc2gub250aGVnb0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiYjA0YWJlNjRlNmI5NDZmMDVhMjgiLCJzY29wZWRLZXlTZWNyZXQiOiJmN2I0MTI4NjNmOTQ4MWUwOTBjN2QwY2Q5NjBkMzhhZGM3YThiMTg2OTIyZTE0MWViZDBmOWU1MmI4NmJhYjE5IiwiZXhwIjoxNzcyMzU4Nzg3fQ.TIs8QBjePc2L45RoUA-GNaFwjwfVAvhm9PSCqlQZgEw'
        }
      };
      
      try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if(data?.data?.files) {
          const allFilesContent = [];
          const files = (await Promise.all(data.data.files.map(async (item: any) => {
            if (item.name && item.name.includes('Aptos')) {
              // await writeToLog(`Processing Aptos file: ${JSON.stringify(item)}`);
              const file = await getFile(item.cid);
              allFilesContent.push(...file);
              return file;
            }
          }))).flat();

          // await writeToLog(`Final processed data: ${JSON.stringify(files)}`);
          if (allFilesContent.length > 0) {
            // await writeToLog(`Retrieved file content: ${JSON.stringify(allFilesContent)}`);
          }
          return files;
        }

        // await writeToLog('No files found in response');
        return [];

      } catch (error) {
        // await writeToLog(`Error in getAllData: ${error.message}`);
        console.error('Error:', error);
        return [];
      }
    }