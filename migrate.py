#!/usr/bin/env python
import redis
   
def main():
    pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
    r = redis.Redis(connection_pool=pool)
    print 'Converting all keys from strings to hashes in triggy:set:links'
    links = r.smembers('triggy:set:links')
    for link in links:
        link = 'triggy:resolv:link:'+link
        if r.type(link) == 'string':
            url = r.get(link)
            r.delete(link)
            r.hset(link, 'url', url)
        else:
            print 'Something went wrong in key '+link

    print 'Converting all keys from strings to sets in triggy:set:hashes'
    hashes = r.smembers('triggy:set:hashes')
    for hash_string in hashes:
        hash_string = 'triggy:resolv:hash:'+hash_string
        if r.type(hash_string) == 'string':
            hash_content = r.get(hash_string)
            r.delete(hash_string)
            r.sadd(hash_string, hash_content)
        else:
            print 'Something went wrong in key '+hash_string

if __name__ == '__main__':
    main()