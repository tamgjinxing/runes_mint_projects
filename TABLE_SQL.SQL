CREATE TABLE IF NOT EXISTS tb_address_receive (
  btc_address TEXT PRIMARY KEY,           -- 接收地址，设为主键，确保唯一性
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间，默认当前时间
  update_time DATETIME,                -- 更新时间
  tx_id VARCHAR(64) default null, -- 交易id
  status INTEGER DEFAULT 0                    -- 状态，0：未使用 1：前端已使用 2：支付成功 默认为 0（未使用）
);


/**
字段说明
btc_address：接收地址，使用 TEXT 类型，并作为主键，确保地址唯一。
created_at：创建时间，使用 DATETIME 类型，默认值为当前时间 CURRENT_TIMESTAMP。
update_time : 更新时间
status：状态，使用 INTEGER 类型，初始默认值为 0。状态值说明：
0：未使用
1：前端已调用
2：支付成功
***/